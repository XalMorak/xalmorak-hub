import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  IMAGE_LIMIT,
  VIDEO_LIMIT,
  assertRateLimit,
  assertSlug,
  decodeBase64Payload,
  displayNameFor,
  inspectImage,
  inspectVideo,
  parseVideoUrl,
  vimeoEmbed,
  youtubeEmbed,
} from "@/lib/security";

function asIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

export type Clip = {
  id: number;
  user_id: string;
  author_name: string;
  game_slug: string;
  attachment_kind: string;
  attachment_mime: string | null;
  attachment_data: string;
  created_at: string;
};

export const listClips = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => ({ slug: assertSlug(input.slug) }))
  .handler(async ({ data }): Promise<Clip[]> => {
    const sql = await getSql();
    const rows = await sql<Clip>`
      select id, user_id, author_name, game_slug,
             attachment_kind, attachment_mime, attachment_data,
             created_at::text as created_at
      from game_clips
      where game_slug = ${data.slug}
      order by created_at desc
      limit 12
    `;
    return rows.map((r) => ({ ...r, created_at: asIso(r.created_at) }));
  });

export const postClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string; image?: string; video?: string; videoUrl?: string }) => ({
    slug: assertSlug(input.slug),
    image: input.image,
    video: input.video,
    videoUrl: input.videoUrl?.trim() ?? "",
  }))
  .handler(async ({ context, data }): Promise<Clip> => {
    await assertRateLimit(context.userId, "gallery");
    const mediaCount = [data.image, data.video, data.videoUrl].filter(Boolean).length;
    if (mediaCount !== 1) throw new Error("Нэг клип — нэг файл");

    let kind = "";
    let mime: string | null = null;
    let payload = "";

    if (data.image) {
      const bytes = decodeBase64Payload(data.image, IMAGE_LIMIT);
      const info = inspectImage(bytes);
      kind = "image";
      mime = info.mime;
      payload = `data:${info.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } else if (data.video) {
      const bytes = decodeBase64Payload(data.video, VIDEO_LIMIT);
      const info = inspectVideo(bytes);
      kind = "video";
      mime = info.mime;
      payload = `data:${info.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } else {
      const parsed = parseVideoUrl(data.videoUrl);
      kind = "video_url";
      mime = "text/uri-list";
      if (parsed.kind === "youtube") payload = youtubeEmbed(parsed.id);
      else if (parsed.kind === "vimeo") payload = vimeoEmbed(parsed.id);
      else payload = parsed.href;
    }

    const sql = await getSql();
    const name = await displayNameFor(context.userId);
    const rows = await sql<Clip>`
      insert into game_clips (
        user_id, author_name, game_slug,
        attachment_kind, attachment_mime, attachment_data
      )
      values (
        ${context.userId}, ${name}, ${data.slug},
        ${kind}, ${mime}, ${payload}
      )
      returning id, user_id, author_name, game_slug,
                attachment_kind, attachment_mime, attachment_data,
                created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Оруулсангүй");
    return { ...row, created_at: asIso(row.created_at) };
  });
