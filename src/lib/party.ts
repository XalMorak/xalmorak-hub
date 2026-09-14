import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isRegion, type RegionId } from "@/lib/regions";
import {
  assertRateLimit,
  assertSlug,
  displayNameFor,
  sanitizeChatBody,
} from "@/lib/security";

function asIso(value: string | Date | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}

export type PartyPost = {
  id: number;
  user_id: string;
  author_name: string;
  game_slug: string;
  title: string;
  body: string;
  region: RegionId;
  slots: number;
  scheduled_at: string | null;
  created_at: string;
};

export const listParty = createServerFn({ method: "GET" })
  .validator((input?: { game?: string; region?: string }) => ({
    game: input?.game ? assertSlug(input.game) : "",
    region: input?.region && isRegion(input.region) ? input.region : "",
  }))
  .handler(async ({ data }): Promise<PartyPost[]> => {
    const sql = await getSql();
    const rows = data.game
      ? await sql<PartyPost>`
          select id, user_id, author_name, game_slug, title, body, region, slots,
                 scheduled_at::text as scheduled_at, created_at::text as created_at
          from lfg_posts
          where game_slug = ${data.game}
            and created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()}
          order by created_at desc
          limit 40
        `
      : data.region
        ? await sql<PartyPost>`
            select id, user_id, author_name, game_slug, title, body, region, slots,
                   scheduled_at::text as scheduled_at, created_at::text as created_at
            from lfg_posts
            where region = ${data.region}
              and created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()}
            order by created_at desc
            limit 40
          `
        : await sql<PartyPost>`
            select id, user_id, author_name, game_slug, title, body, region, slots,
                   scheduled_at::text as scheduled_at, created_at::text as created_at
            from lfg_posts
            where created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()}
            order by created_at desc
            limit 40
          `;
    return rows.map((r) => ({
      ...r,
      region: (isRegion(r.region) ? r.region : "mn") as RegionId,
      scheduled_at: asIso(r.scheduled_at),
      created_at: asIso(r.created_at) ?? "",
    }));
  });

export const postParty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    game: string;
    title: string;
    body: string;
    region: string;
    slots: number;
    scheduledAt?: string;
  }) => {
    const title = sanitizeChatBody(input.title).slice(0, 80);
    const body = sanitizeChatBody(input.body).slice(0, 400);
    if (title.length < 2) throw new Error("Гарчиг богино");
    if (body.length < 4) throw new Error("Тайлбар богино");
    if (!isRegion(input.region)) throw new Error("Бүс буруу");
    const slots = Number(input.slots);
    if (!Number.isInteger(slots) || slots < 2 || slots > 10) {
      throw new Error("Тоо 2–10");
    }
    let scheduledAt: string | null = null;
    if (input.scheduledAt) {
      const t = Date.parse(input.scheduledAt);
      if (!Number.isFinite(t)) throw new Error("Цаг буруу");
      scheduledAt = new Date(t).toISOString();
    }
    return {
      game: assertSlug(input.game),
      title,
      body,
      region: input.region as RegionId,
      slots,
      scheduledAt,
    };
  })
  .handler(async ({ context, data }): Promise<PartyPost> => {
    await assertRateLimit(context.userId, "lfg");
    const sql = await getSql();
    const name = await displayNameFor(context.userId);
    const rows = await sql<PartyPost>`
      insert into lfg_posts (
        user_id, author_name, game_slug, title, body, region, slots, scheduled_at
      )
      values (
        ${context.userId}, ${name}, ${data.game}, ${data.title}, ${data.body},
        ${data.region}, ${data.slots}, ${data.scheduledAt}
      )
      returning id, user_id, author_name, game_slug, title, body, region, slots,
                scheduled_at::text as scheduled_at, created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Нийтлэгдсэнгүй");
    return {
      ...row,
      region: data.region,
      scheduled_at: asIso(row.scheduled_at),
      created_at: asIso(row.created_at) ?? "",
    };
  });
