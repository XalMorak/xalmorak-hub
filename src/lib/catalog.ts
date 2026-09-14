import { createServerFn } from "@tanstack/react-start";
import { fetchCatalogJson } from "@/lib/security";
import { STEAM_IDS, type Game, type GenreId, type Motif, type PlatformId } from "@/lib/games";

export type SteamHit = {
  slug: string;
  steamId: number;
  title: string;
  score: number;
  coverUrl: string;
  tinyCover: string;
};

export type SteamDetail = {
  slug: string;
  steamId: number;
  title: string;
  developer: string;
  year: number;
  summary: string;
  body: string;
  score: number;
  playtime: string;
  coverUrl: string;
  platforms: PlatformId[];
  genres: GenreId[];
  metacriticUrl: string | null;
};

export type Deal = {
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  dealUrl: string;
};

function steamCover(id: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

function steamCapsule(id: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_231x87.jpg`;
}

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .trim();
}

const GENRE_MAP: Record<string, GenreId> = {
  rpg: "rpg",
  action: "action",
  adventure: "adventure",
  strategy: "strategy",
  indie: "indie",
  simulation: "sim",
  "massively multiplayer": "moba",
  fps: "fps",
};

function mapGenres(raw: Array<{ description?: string }> | undefined): GenreId[] {
  const out: GenreId[] = [];
  for (const g of raw ?? []) {
    const key = (g.description ?? "").toLowerCase();
    const mapped = GENRE_MAP[key];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out.length ? out : ["action"];
}

function mapPlatforms(raw: Record<string, boolean> | undefined): PlatformId[] {
  const out: PlatformId[] = [];
  if (raw?.windows || raw?.mac || raw?.linux) out.push("pc");
  return out.length ? out : ["pc"];
}

type StoreSearch = {
  items?: Array<{
    id: number;
    name: string;
    tiny_image?: string;
    metascore?: string;
  }>;
};

export const searchCatalog = createServerFn({ method: "GET" })
  .validator((input: { q: string }) => {
    const q = input.q.trim().slice(0, 80);
    return { q };
  })
  .handler(async ({ data }): Promise<SteamHit[]> => {
    if (data.q.length < 2) return [];
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(data.q)}&l=english&cc=us`;
    const json = (await fetchCatalogJson(url)) as StoreSearch;
    return (json.items ?? []).slice(0, 16).map((item) => ({
      slug: `steam-${item.id}`,
      steamId: item.id,
      title: item.name,
      score: Number(item.metascore) || 0,
      coverUrl: steamCover(item.id),
      tinyCover: item.tiny_image || steamCapsule(item.id),
    }));
  });

type Featured = {
  specials?: { items?: Array<{ id: number; name: string }> };
  top_sellers?: { items?: Array<{ id: number; name: string }> };
};

export const listFeaturedSteam = createServerFn({ method: "GET" }).handler(
  async (): Promise<SteamHit[]> => {
    try {
      const json = (await fetchCatalogJson(
        "https://store.steampowered.com/api/featuredcategories/?l=english&cc=us",
      )) as Featured;
      const items = [
        ...(json.specials?.items ?? []),
        ...(json.top_sellers?.items ?? []),
      ];
      const seen = new Set<number>();
      const hits: SteamHit[] = [];
      for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        hits.push({
          slug: `steam-${item.id}`,
          steamId: item.id,
          title: item.name,
          score: 0,
          coverUrl: steamCover(item.id),
          tinyCover: steamCapsule(item.id),
        });
        if (hits.length >= 8) break;
      }
      return hits;
    } catch {
      return [];
    }
  },
);

type AppDetails = Record<
  string,
  {
    success?: boolean;
    data?: {
      name?: string;
      developers?: string[];
      release_date?: { date?: string };
      short_description?: string;
      detailed_description?: string;
      metacritic?: { score?: number; url?: string };
      header_image?: string;
      platforms?: Record<string, boolean>;
      genres?: Array<{ description?: string }>;
    };
  }
>;

export const getSteamGame = createServerFn({ method: "GET" })
  .validator((input: { steamId: number }) => {
    const steamId = Number(input.steamId);
    if (!Number.isInteger(steamId) || steamId <= 0 || steamId > 9_000_000_000) {
      throw new Error("Тоглоом буруу");
    }
    return { steamId };
  })
  .handler(async ({ data }): Promise<SteamDetail | null> => {
    const json = (await fetchCatalogJson(
      `https://store.steampowered.com/api/appdetails?appids=${data.steamId}&l=english`,
    )) as AppDetails;
    const entry = json[String(data.steamId)];
    if (!entry?.success || !entry.data) return null;
    const d = entry.data;
    const yearMatch = (d.release_date?.date ?? "").match(/(19|20)\d{2}/);
    const body = stripHtml(d.detailed_description ?? d.short_description ?? "").slice(
      0,
      1600,
    );
    return {
      slug: `steam-${data.steamId}`,
      steamId: data.steamId,
      title: d.name ?? "Unknown",
      developer: d.developers?.[0] ?? "Unknown",
      year: yearMatch ? Number(yearMatch[0]) : 0,
      summary: stripHtml(d.short_description ?? "").slice(0, 220),
      body,
      score: d.metacritic?.score ?? 0,
      playtime: "—",
      coverUrl: d.header_image ?? steamCover(data.steamId),
      platforms: mapPlatforms(d.platforms),
      genres: mapGenres(d.genres),
      metacriticUrl: d.metacritic?.url ?? null,
    };
  });

type CheapDeal = Array<{
  title?: string;
  salePrice?: string;
  normalPrice?: string;
  savings?: string;
  dealID?: string;
}>;

export const getDeals = createServerFn({ method: "GET" })
  .validator((input: { steamId: number }) => {
    const steamId = Number(input.steamId);
    if (!Number.isInteger(steamId) || steamId <= 0) throw new Error("Тоглоом буруу");
    return { steamId };
  })
  .handler(async ({ data }): Promise<Deal[]> => {
    try {
      const json = (await fetchCatalogJson(
        `https://www.cheapshark.com/api/1.0/deals?steamAppID=${data.steamId}&pageSize=4`,
      )) as CheapDeal;
      return (json ?? []).slice(0, 4).map((d) => ({
        title: d.title ?? "",
        salePrice: d.salePrice ?? "",
        normalPrice: d.normalPrice ?? "",
        savings: d.savings ?? "0",
        dealUrl: d.dealID
          ? `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(d.dealID)}`
          : "https://www.cheapshark.com/",
      }));
    } catch {
      return [];
    }
  });

const MOTIFS: Motif[] = [
  "rings",
  "grid",
  "slash",
  "orbit",
  "bars",
  "plus",
  "arc",
  "steps",
  "diamond",
  "wave",
];

export function steamDetailToGame(d: SteamDetail): Game {
  return {
    slug: d.slug,
    title: d.title,
    developer: d.developer,
    year: d.year,
    genres: d.genres,
    platforms: d.platforms,
    score: d.score,
    playtime: d.playtime,
    summary: d.summary,
    body: d.body,
    motif: MOTIFS[d.steamId % MOTIFS.length] ?? "grid",
    steamId: d.steamId,
    coverUrl: d.coverUrl,
  };
}

export function steamHitToGame(hit: SteamHit): Game {
  return {
    slug: hit.slug,
    title: hit.title,
    developer: "Steam",
    year: 0,
    genres: ["action"],
    platforms: ["pc"],
    score: hit.score,
    playtime: "—",
    summary: "",
    body: "",
    motif: MOTIFS[hit.steamId % MOTIFS.length] ?? "grid",
    steamId: hit.steamId,
    coverUrl: hit.coverUrl,
  };
}

export function parseSteamSlug(slug: string): number | null {
  const m = /^steam-(\d{1,10})$/.exec(slug);
  if (!m) return STEAM_IDS[slug] ?? null;
  return Number(m[1]);
}
