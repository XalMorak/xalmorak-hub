import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const listWishlist = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<string[]> => {
    const sql = await getSql();
    const rows = await sql<{ game_slug: string }>`
      select game_slug from wishlists
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map((r) => r.game_slug);
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string }) => {
    const slug = input.slug.trim().slice(0, 80);
    if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error("Тоглоом буруу");
    return { slug };
  })
  .handler(async ({ context, data }): Promise<{ on: boolean }> => {
    const sql = await getSql();
    const existing = await sql<{ game_slug: string }>`
      select game_slug from wishlists
      where user_id = ${context.userId} and game_slug = ${data.slug}
      limit 1
    `;
    if (existing[0]) {
      await sql`
        delete from wishlists
        where user_id = ${context.userId} and game_slug = ${data.slug}
      `;
      return { on: false };
    }
    await sql`
      insert into wishlists (user_id, game_slug)
      values (${context.userId}, ${data.slug})
    `;
    return { on: true };
  });
