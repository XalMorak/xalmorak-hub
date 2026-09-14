import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

function asIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

export type GameRank = {
  game_slug: string;
  count: number;
  avg: number;
};

export type PlayerRank = {
  user_id: string;
  name: string;
  reviews: number;
  avg: number;
};

export type VoiceRank = {
  user_id: string;
  name: string;
  posts: number;
};

export type BoardData = {
  weekGames: GameRank[];
  reviewers: PlayerRank[];
  voices: VoiceRank[];
  generated_at: string;
};

export const getBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<BoardData> => {
    const sql = await getSql();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
    const weekGames = await sql<GameRank>`
      select game_slug, count(*)::int as count, avg(rating)::float as avg
      from reviews
      where created_at > ${since}
      group by game_slug
      order by count desc, avg desc
      limit 8
    `;
    const reviewers = await sql<PlayerRank>`
      select user_id, max(author_name) as name,
             count(*)::int as reviews, avg(rating)::float as avg
      from reviews
      group by user_id
      order by reviews desc, avg desc
      limit 8
    `;
    const voices = await sql<VoiceRank>`
      select user_id, max(author_name) as name, count(*)::int as posts
      from lounge_messages
      where created_at > ${since}
      group by user_id
      order by posts desc
      limit 8
    `;
    return {
      weekGames: weekGames.map((r) => ({
        game_slug: r.game_slug,
        count: Number(r.count),
        avg: Number(r.avg),
      })),
      reviewers: reviewers.map((r) => ({
        user_id: r.user_id,
        name: (r.name || "Тоглогч").slice(0, 48),
        reviews: Number(r.reviews),
        avg: Number(r.avg),
      })),
      voices: voices.map((r) => ({
        user_id: r.user_id,
        name: (r.name || "Тоглогч").slice(0, 48),
        posts: Number(r.posts),
      })),
      generated_at: asIso(new Date()),
    };
  },
);
