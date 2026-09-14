import { getSql } from "@/lib/db";

const MAX_IMAGE_BYTES = 350_000;
const MAX_VIDEO_BYTES = 1_500_000;
const MAX_MESSAGE_CHARS = 2000;

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBM = [0x1a, 0x45, 0xdf, 0xa3];

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

function looksLikeHtml(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 256))
    .toLowerCase();
  return (
    head.includes("<script") ||
    head.includes("<html") ||
    head.includes("<?php") ||
    head.includes("<svg") ||
    head.includes("javascript:")
  );
}

export function decodeBase64Payload(raw: string, maxBytes: number): Uint8Array {
  const cleaned = raw.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+=*$/.test(cleaned) || cleaned.length > maxBytes * 2) {
    throw new Error("Файлын формат зөвшөөрөгдөөгүй");
  }
  const buf = Buffer.from(cleaned, "base64");
  if (buf.length < 12 || buf.length > maxBytes) {
    throw new Error("Файлын хэмжээ хэтэрсэн");
  }
  return new Uint8Array(buf);
}

export function inspectImage(bytes: Uint8Array): { mime: string } {
  if (looksLikeHtml(bytes)) throw new Error("Аюултай файл");
  if (startsWith(bytes, JPEG)) return { mime: "image/jpeg" };
  if (startsWith(bytes, PNG)) return { mime: "image/png" };
  if (
    startsWith(bytes, WEBP_RIFF) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp" };
  }
  throw new Error("Зөвхөн JPEG, PNG, WebP зөвшөөрнө");
}

export function inspectVideo(bytes: Uint8Array): { mime: string } {
  if (looksLikeHtml(bytes)) throw new Error("Аюултай файл");
  if (startsWith(bytes, WEBM)) return { mime: "video/webm" };
  const ftyp = String.fromCharCode(
    bytes[4] ?? 0,
    bytes[5] ?? 0,
    bytes[6] ?? 0,
    bytes[7] ?? 0,
  );
  if (ftyp === "ftyp") return { mime: "video/mp4" };
  throw new Error("Зөвхөн MP4, WebM зөвшөөрнө");
}

export function sanitizeChatBody(input: string): string {
  const body = input.replace(/\0/g, "").trim();
  if (body.length > MAX_MESSAGE_CHARS) {
    throw new Error("Зурвас хэт урт байна");
  }
  return body;
}

export type SafeVideoLink =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; href: string };

export function parseVideoUrl(raw: string): SafeVideoLink {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Холбоос буруу");
  }
  if (url.protocol !== "https:") throw new Error("Зөвхөн HTTPS холбоос");
  if (url.username || url.password) throw new Error("Холбоос буруу");
  const host = url.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    let id = "";
    if (host === "youtu.be" || host === "www.youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else {
      id = url.searchParams.get("v") ?? "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (!id && (parts[0] === "embed" || parts[0] === "shorts")) {
        id = parts[1] ?? "";
      }
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error("YouTube ID буруу");
    return { kind: "youtube", id };
  }

  if (VIMEO_HOSTS.has(host)) {
    const id = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    if (!/^\d{6,12}$/.test(id)) throw new Error("Vimeo ID буруу");
    return { kind: "vimeo", id };
  }

  if (!/\.(mp4|webm)$/i.test(url.pathname)) {
    throw new Error("Видео холбоос зөвшөөрөгдөөгүй");
  }
  return { kind: "file", href: url.href };
}

export function youtubeEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function vimeoEmbed(id: string): string {
  return `https://player.vimeo.com/video/${id}`;
}

const LIMITS: Record<string, { windowMs: number; max: number }> = {
  lounge: { windowMs: 60_000, max: 20 },
  chat: { windowMs: 60_000, max: 20 },
  media: { windowMs: 60 * 60_000, max: 12 },
  group: { windowMs: 24 * 60 * 60_000, max: 8 },
  review: { windowMs: 60_000, max: 8 },
};

export async function assertRateLimit(userId: string, kind: keyof typeof LIMITS) {
  const rule = LIMITS[kind];
  const sql = await getSql();
  const since = new Date(Date.now() - rule.windowMs).toISOString();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n
    from rate_events
    where user_id = ${userId} and kind = ${kind} and created_at > ${since}
  `;
  if ((rows[0]?.n ?? 0) >= rule.max) {
    throw new Error("Хэт олон хүсэлт. Түр хүлээнэ үү.");
  }
  await sql`
    insert into rate_events (user_id, kind) values (${userId}, ${kind})
  `;
}

export async function displayNameFor(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ name: string }>`
    select name from "user" where id = ${userId} limit 1
  `;
  const name = rows[0]?.name?.trim();
  return name && name.length > 0 ? name.slice(0, 48) : "Тоглогч";
}

export function assertSlug(slug: string): string {
  const s = slug.trim().slice(0, 80);
  if (!/^[a-z0-9-]+$/i.test(s)) throw new Error("Тоглоом буруу");
  return s;
}

export const IMAGE_LIMIT = MAX_IMAGE_BYTES;
export const VIDEO_LIMIT = MAX_VIDEO_BYTES;

const CATALOG_HOSTS = new Set([
  "store.steampowered.com",
  "steamcommunity.com",
  "www.cheapshark.com",
]);

export async function fetchCatalogJson(url: string): Promise<unknown> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("blocked");
  if (!CATALOG_HOSTS.has(parsed.hostname)) throw new Error("blocked");
  const res = await fetch(parsed.href, {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
    headers: { Accept: "application/json", "User-Agent": "XalMorakHub/1.0" },
  });
  if (!res.ok) throw new Error("Каталог уншигдсангүй");
  return res.json();
}
