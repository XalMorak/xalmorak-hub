import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { CHANNELS, type ChannelId } from "@/lib/channels";
import { assertRateLimit, assertSlug, displayNameFor, sanitizeChatBody } from "@/lib/security";

export type LoungeMessage = {
  id: number;
  user_id: string;
  author_name: string;
  channel: string;
  body: string;
  created_at: string;
};

export type Review = {
  id: number;
  user_id: string;
  author_name: string;
  game_slug: string;
  rating: number;
  body: string;
  created_at: string;
};

export type ReviewStat = {
  game_slug: string;
  count: number;
  avg: number;
};

const CHANNEL_IDS = CHANNELS.map((c) => c.id);

function asIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

async function authorNameFor(userId: string): Promise<string> {
  return displayNameFor(userId);
}

export const listMessages = createServerFn({ method: "GET" })
  .validator((input: { channel: string }) => {
    const channel = input.channel.trim();
    if (!CHANNEL_IDS.includes(channel as ChannelId)) {
      throw new Error("Суваг буруу байна");
    }
    return { channel };
  })
  .handler(async ({ data }): Promise<LoungeMessage[]> => {
    const sql = await getSql();
    const rows = await sql<LoungeMessage>`
      select id, user_id, author_name, channel, body, created_at::text as created_at
      from lounge_messages
      where channel = ${data.channel}
      order by created_at asc, id asc
      limit 80
    `;
    return rows.map((row) => ({ ...row, created_at: asIso(row.created_at) }));
  });

export const listRecentMessages = createServerFn({ method: "GET" }).handler(
  async (): Promise<LoungeMessage[]> => {
    const sql = await getSql();
    const rows = await sql<LoungeMessage>`
      select id, user_id, author_name, channel, body, created_at::text as created_at
      from lounge_messages
      order by created_at desc
      limit 6
    `;
    return rows.map((row) => ({ ...row, created_at: asIso(row.created_at) }));
  },
);

export const postMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { channel: string; body: string }) => {
    const channel = input.channel.trim();
    const body = sanitizeChatBody(input.body);
    if (!CHANNEL_IDS.includes(channel as ChannelId)) {
      throw new Error("Сувгийг сонгоно уу");
    }
    if (body.length < 1) {
      throw new Error("Зурвас 1–400 тэмдэгттэй байх ёстой");
    }
    if (body.length > 400) {
      throw new Error("Зурвас 1–400 тэмдэгттэй байх ёстой");
    }
    return { channel, body };
  })
  .handler(async ({ context, data }): Promise<LoungeMessage> => {
    await assertRateLimit(context.userId, "lounge");
    const sql = await getSql();
    const name = await authorNameFor(context.userId);
    const rows = await sql<LoungeMessage>`
      insert into lounge_messages (user_id, author_name, channel, body)
      values (${context.userId}, ${name}, ${data.channel}, ${data.body})
      returning id, user_id, author_name, channel, body, created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Зурвас илгээгдсэнгүй");
    return { ...row, created_at: asIso(row.created_at) };
  });

export const listReviews = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => {
    const slug = assertSlug(input.slug);
    return { slug };
  })
  .handler(async ({ data }): Promise<Review[]> => {
    const sql = await getSql();
    const rows = await sql<Review>`
      select id, user_id, author_name, game_slug, rating, body, created_at::text as created_at
      from reviews
      where game_slug = ${data.slug}
      order by created_at desc
    `;
    return rows.map((row) => ({ ...row, created_at: asIso(row.created_at) }));
  });

export const listReviewStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<ReviewStat[]> => {
    const sql = await getSql();
    return (await sql<ReviewStat>`
      select game_slug, count(*)::int as count, avg(rating)::float as avg
      from reviews
      group by game_slug
    `).map((row) => ({
      game_slug: row.game_slug,
      count: Number(row.count),
      avg: Number(row.avg),
    }));
  },
);

export const postReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string; rating: number; body: string }) => {
    const slug = assertSlug(input.slug);
    const body = sanitizeChatBody(input.body.trim());

    const rating = Number(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      throw new Error("Үнэлгээ 1–10 байх ёстой");
    }
    if (body.length < 8 || body.length > 600) {
      throw new Error("Сэтгэгдэл 8–600 тэмдэгттэй байх ёстой");
    }
    return { slug, rating, body };
  })
  .handler(async ({ context, data }): Promise<Review> => {
    await assertRateLimit(context.userId, "review");
    const sql = await getSql();
    const name = await authorNameFor(context.userId);
    const rows = await sql<Review>`
      insert into reviews (user_id, author_name, game_slug, rating, body)
      values (${context.userId}, ${name}, ${data.slug}, ${data.rating}, ${data.body})
      on conflict (user_id, game_slug) do update
        set rating = excluded.rating,
            body = excluded.body,
            author_name = excluded.author_name,
            created_at = now()
      returning id, user_id, author_name, game_slug, rating, body, created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Сэтгэгдэл хадгалагдаагүй");
    return { ...row, created_at: asIso(row.created_at) };
  });
