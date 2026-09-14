import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isRegion, type RegionId } from "@/lib/regions";
import {
  AVATAR_LIMIT,
  assertHref,
  assertRateLimit,
  assertUserId,
  decodeBase64Payload,
  displayNameFor,
  inspectImage,
  sanitizeChatBody,
} from "@/lib/security";

function asIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

function pair(a: string, b: string): { user_a: string; user_b: string } {
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a };
}

export async function areBlocked(a: string, b: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from blocks
    where (blocker_id = ${a} and blocked_id = ${b})
       or (blocker_id = ${b} and blocked_id = ${a})
  `;
  return (rows[0]?.n ?? 0) > 0;
}

export async function assertNotBlocked(a: string, b: string) {
  if (await areBlocked(a, b)) throw new Error("Хандах эрхгүй");
}

export async function pushNotice(input: {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  href: string;
}) {
  const sql = await getSql();
  const href = assertHref(input.href);
  const recent = await sql<{ id: number }>`
    select id from notifications
    where user_id = ${input.userId}
      and href = ${href}
      and kind = ${input.kind}
      and read_at is null
      and created_at > ${new Date(Date.now() - 10 * 60_000).toISOString()}
    limit 1
  `;
  if (recent[0]) return;
  await sql`
    insert into notifications (user_id, kind, title, body, href)
    values (
      ${input.userId},
      ${input.kind.slice(0, 24)},
      ${input.title.slice(0, 80)},
      ${(input.body ?? "").slice(0, 160)},
      ${href}
    )
  `;
}

export type PublicProfile = {
  id: string;
  name: string;
  bio: string;
  region: RegionId;
  avatar: string | null;
  reviews: number;
  avg: number | null;
  friends: number;
  relation: "self" | "friends" | "incoming" | "outgoing" | "blocked" | "none";
};

export const getProfile = createServerFn({ method: "GET" })
  .validator((input: { userId: string }) => ({
    userId: assertUserId(input.userId),
  }))
  .handler(async ({ data }): Promise<PublicProfile> => {
    const sql = await getSql();
    const user = await sql<{ id: string; name: string }>`
      select id, name from "user" where id = ${data.userId} limit 1
    `;
    if (!user[0]) throw new Error("Хэрэглэгч олдсонгүй");
    const profile = await sql<{
      bio: string;
      region: string;
      avatar_data: string | null;
    }>`
      select bio, region, avatar_data from profiles where user_id = ${data.userId} limit 1
    `;
    const stats = await sql<{ reviews: number; avg: number | null }>`
      select count(*)::int as reviews, avg(rating)::float as avg
      from reviews where user_id = ${data.userId}
    `;
    const friendCount = await sql<{ n: number }>`
      select count(*)::int as n from friendships
      where status = 'accepted' and (user_a = ${data.userId} or user_b = ${data.userId})
    `;
    const region = isRegion(profile[0]?.region ?? "mn") ? profile[0]!.region : "mn";
    return {
      id: user[0].id,
      name: (user[0].name || "Тоглогч").slice(0, 48),
      bio: (profile[0]?.bio ?? "").slice(0, 280),
      region: region as RegionId,
      avatar: profile[0]?.avatar_data ?? null,
      reviews: stats[0]?.reviews ?? 0,
      avg: stats[0]?.avg ?? null,
      friends: friendCount[0]?.n ?? 0,
      relation: "none",
    };
  });

export const getRelation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => ({ userId: assertUserId(input.userId) }))
  .handler(async ({ context, data }): Promise<PublicProfile["relation"]> => {
    if (data.userId === context.userId) return "self";
    if (await areBlocked(context.userId, data.userId)) return "blocked";
    const { user_a, user_b } = pair(context.userId, data.userId);
    const sql = await getSql();
    const row = await sql<{ status: string; requester_id: string }>`
      select status, requester_id from friendships
      where user_a = ${user_a} and user_b = ${user_b} limit 1
    `;
    if (row[0]?.status === "accepted") return "friends";
    if (row[0]?.status === "pending") {
      return row[0].requester_id === context.userId ? "outgoing" : "incoming";
    }
    return "none";
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { bio: string; region: string; avatar?: string }) => {
    const bio = sanitizeChatBody(input.bio ?? "").slice(0, 280);
    if (!isRegion(input.region)) throw new Error("Бүс буруу");
    return { bio, region: input.region as RegionId, avatar: input.avatar };
  })
  .handler(async ({ context, data }): Promise<void> => {
    await assertRateLimit(context.userId, "profile");
    let avatarMime: string | null = null;
    let avatarData: string | null = null;
    if (data.avatar) {
      const bytes = decodeBase64Payload(data.avatar, AVATAR_LIMIT);
      const info = inspectImage(bytes);
      avatarMime = info.mime;
      avatarData = `data:${info.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    }
    const sql = await getSql();
    if (avatarData) {
      await sql`
        insert into profiles (user_id, bio, region, avatar_mime, avatar_data)
        values (${context.userId}, ${data.bio}, ${data.region}, ${avatarMime}, ${avatarData})
        on conflict (user_id) do update
          set bio = excluded.bio,
              region = excluded.region,
              avatar_mime = excluded.avatar_mime,
              avatar_data = excluded.avatar_data,
              updated_at = now()
      `;
    } else {
      await sql`
        insert into profiles (user_id, bio, region)
        values (${context.userId}, ${data.bio}, ${data.region})
        on conflict (user_id) do update
          set bio = excluded.bio, region = excluded.region, updated_at = now()
      `;
    }
  });

export type FriendRow = {
  id: string;
  name: string;
  status: "pending" | "accepted";
  incoming: boolean;
};

export const listFriends = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<FriendRow[]> => {
    const sql = await getSql();
    const rows = await sql<{
      other_id: string;
      name: string;
      status: "pending" | "accepted";
      requester_id: string;
    }>`
      select
        case when f.user_a = ${context.userId} then f.user_b else f.user_a end as other_id,
        u.name,
        f.status,
        f.requester_id
      from friendships f
      join "user" u on u.id = case when f.user_a = ${context.userId} then f.user_b else f.user_a end
      where f.user_a = ${context.userId} or f.user_b = ${context.userId}
      order by f.created_at desc
      limit 80
    `;
    return rows.map((r) => ({
      id: r.other_id,
      name: (r.name || "Тоглогч").slice(0, 48),
      status: r.status,
      incoming: r.status === "pending" && r.requester_id !== context.userId,
    }));
  });

export const requestFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => ({ userId: assertUserId(input.userId) }))
  .handler(async ({ context, data }): Promise<void> => {
    if (data.userId === context.userId) throw new Error("Өөртөө найз биш");
    await assertNotBlocked(context.userId, data.userId);
    await assertRateLimit(context.userId, "friend");
    const sql = await getSql();
    const exists = await sql<{ id: string }>`
      select id from "user" where id = ${data.userId} limit 1
    `;
    if (!exists[0]) throw new Error("Хэрэглэгч олдсонгүй");
    const { user_a, user_b } = pair(context.userId, data.userId);
    const current = await sql<{ status: string; requester_id: string }>`
      select status, requester_id from friendships
      where user_a = ${user_a} and user_b = ${user_b} limit 1
    `;
    if (current[0]?.status === "accepted") return;
    if (current[0]?.status === "pending" && current[0].requester_id !== context.userId) {
      await sql`
        update friendships set status = 'accepted'
        where user_a = ${user_a} and user_b = ${user_b}
      `;
      await pushNotice({
        userId: data.userId,
        kind: "friend",
        title: "Найз боллоо",
        href: `/u/${context.userId}`,
      });
      return;
    }
    await sql`
      insert into friendships (user_a, user_b, requester_id, status)
      values (${user_a}, ${user_b}, ${context.userId}, 'pending')
      on conflict (user_a, user_b) do nothing
    `;
    const name = await displayNameFor(context.userId);
    await pushNotice({
      userId: data.userId,
      kind: "friend",
      title: "Найзын хүсэлт",
      body: name,
      href: "/friends",
    });
  });

export const respondFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; accept: boolean }) => ({
    userId: assertUserId(input.userId),
    accept: Boolean(input.accept),
  }))
  .handler(async ({ context, data }): Promise<void> => {
    const { user_a, user_b } = pair(context.userId, data.userId);
    const sql = await getSql();
    const row = await sql<{ requester_id: string; status: string }>`
      select requester_id, status from friendships
      where user_a = ${user_a} and user_b = ${user_b} limit 1
    `;
    if (!row[0] || row[0].status !== "pending") throw new Error("Хүсэлт олдсонгүй");
    if (row[0].requester_id === context.userId) throw new Error("Хүлээнэ үү");
    if (data.accept) {
      await sql`
        update friendships set status = 'accepted'
        where user_a = ${user_a} and user_b = ${user_b}
      `;
      await pushNotice({
        userId: data.userId,
        kind: "friend",
        title: "Найз боллоо",
        href: `/u/${context.userId}`,
      });
    } else {
      await sql`
        delete from friendships where user_a = ${user_a} and user_b = ${user_b}
      `;
    }
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => ({ userId: assertUserId(input.userId) }))
  .handler(async ({ context, data }): Promise<void> => {
    const { user_a, user_b } = pair(context.userId, data.userId);
    const sql = await getSql();
    await sql`delete from friendships where user_a = ${user_a} and user_b = ${user_b}`;
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => ({ userId: assertUserId(input.userId) }))
  .handler(async ({ context, data }): Promise<void> => {
    if (data.userId === context.userId) throw new Error("Өөрийгөө хориглохгүй");
    await assertRateLimit(context.userId, "report");
    const sql = await getSql();
    await sql`
      insert into blocks (blocker_id, blocked_id)
      values (${context.userId}, ${data.userId})
      on conflict do nothing
    `;
    const { user_a, user_b } = pair(context.userId, data.userId);
    await sql`delete from friendships where user_a = ${user_a} and user_b = ${user_b}`;
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => ({ userId: assertUserId(input.userId) }))
  .handler(async ({ context, data }): Promise<void> => {
    const sql = await getSql();
    await sql`
      delete from blocks
      where blocker_id = ${context.userId} and blocked_id = ${data.userId}
    `;
  });

export const listBlocked = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ id: string; name: string }[]> => {
    const sql = await getSql();
    const rows = await sql<{ id: string; name: string }>`
      select u.id, u.name from blocks b
      join "user" u on u.id = b.blocked_id
      where b.blocker_id = ${context.userId}
      order by b.created_at desc
      limit 40
    `;
    return rows.map((r) => ({ id: r.id, name: (r.name || "Тоглогч").slice(0, 48) }));
  });

const REPORT_REASONS = new Set(["spam", "abuse", "cheat", "other"]);

export const reportUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string; reason: string; body: string }) => {
    const reason = input.reason.trim();
    if (!REPORT_REASONS.has(reason)) throw new Error("Шалтгаан буруу");
    return {
      userId: assertUserId(input.userId),
      reason,
      body: sanitizeChatBody(input.body ?? "").slice(0, 400),
    };
  })
  .handler(async ({ context, data }): Promise<void> => {
    if (data.userId === context.userId) throw new Error("Өөрийгөө мэдэгдэхгүй");
    await assertRateLimit(context.userId, "report");
    const sql = await getSql();
    await sql`
      insert into reports (reporter_id, target_user_id, reason, body)
      values (${context.userId}, ${data.userId}, ${data.reason}, ${data.body})
    `;
  });

export type Notice = {
  id: number;
  kind: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
};

export const listNotices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Notice[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      kind: string;
      title: string;
      body: string;
      href: string;
      read_at: string | null;
      created_at: string;
    }>`
      select id, kind, title, body, href, read_at::text as read_at,
             created_at::text as created_at
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 40
    `;
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      href: r.href,
      read: Boolean(r.read_at),
      created_at: asIso(r.created_at),
    }));
  });

export const unreadNoticeCount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<number> => {
    const sql = await getSql();
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from notifications
      where user_id = ${context.userId} and read_at is null
    `;
    return rows[0]?.n ?? 0;
  });

export const markNoticesRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<void> => {
    const sql = await getSql();
    await sql`
      update notifications set read_at = now()
      where user_id = ${context.userId} and read_at is null
    `;
  });
