import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  IMAGE_LIMIT,
  VIDEO_LIMIT,
  assertRateLimit,
  decodeBase64Payload,
  displayNameFor,
  inspectImage,
  inspectVideo,
  parseVideoUrl,
  sanitizeChatBody,
  vimeoEmbed,
  youtubeEmbed,
} from "@/lib/security";

export type ConversationSummary = {
  id: number;
  kind: "dm" | "group";
  title: string;
  preview: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  conversation_id: number;
  user_id: string;
  author_name: string;
  body: string;
  attachment_kind: string | null;
  attachment_mime: string | null;
  attachment_data: string | null;
  created_at: string;
};

export type PublicUser = { id: string; name: string };

function asIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}

async function requireMember(conversationId: number, userId: string) {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from conversation_members
    where conversation_id = ${conversationId} and user_id = ${userId}
    limit 1
  `;
  if (!rows[0]) throw new Error("Хандах эрхгүй");
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export const searchPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { q: string }) => ({ q: input.q.trim().slice(0, 40) }))
  .handler(async ({ context, data }): Promise<PublicUser[]> => {
    if (data.q.length < 2) return [];
    const sql = await getSql();
    const pattern = `${data.q.replace(/[%_]/g, "")}%`;
    const rows = await sql<{ id: string; name: string }>`
      select id, name from "user"
      where name ilike ${pattern} and id <> ${context.userId}
      order by name asc
      limit 8
    `;
    return rows.map((r) => ({ id: r.id, name: r.name.slice(0, 48) }));
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ConversationSummary[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      kind: "dm" | "group";
      title: string | null;
      preview: string | null;
      updated_at: string;
      other_name: string | null;
    }>`
      select
        c.id,
        c.kind,
        c.title,
        (
          select body from direct_messages m
          where m.conversation_id = c.id
          order by m.created_at desc, m.id desc
          limit 1
        ) as preview,
        coalesce(
          (
            select created_at::text from direct_messages m
            where m.conversation_id = c.id
            order by m.created_at desc, m.id desc
            limit 1
          ),
          c.created_at::text
        ) as updated_at,
        (
          select u.name from conversation_members cm
          join "user" u on u.id = cm.user_id
          where cm.conversation_id = c.id and cm.user_id <> ${context.userId}
          limit 1
        ) as other_name
      from conversations c
      join conversation_members me
        on me.conversation_id = c.id and me.user_id = ${context.userId}
      order by updated_at desc
      limit 40
    `;
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title:
        r.kind === "group"
          ? r.title || "Бүлэг"
          : r.other_name || "Хувийн чат",
      preview: (r.preview ?? "").slice(0, 80),
      updated_at: asIso(r.updated_at),
    }));
  });

export const openDirect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { userId: string }) => {
    const userId = input.userId.trim();
    if (!userId || userId.length > 80) throw new Error("Хэрэглэгч буруу");
    return { userId };
  })
  .handler(async ({ context, data }): Promise<{ id: number }> => {
    if (data.userId === context.userId) throw new Error("Өөртөө бичихгүй");
    const sql = await getSql();
    const exists = await sql<{ id: string }>`
      select id from "user" where id = ${data.userId} limit 1
    `;
    if (!exists[0]) throw new Error("Хэрэглэгч олдсонгүй");
    const key = pairKey(context.userId, data.userId);
    const found = await sql<{ id: number }>`
      select id from conversations where pair_key = ${key} limit 1
    `;
    if (found[0]) return { id: found[0].id };
    const created = await sql<{ id: number }>`
      insert into conversations (kind, created_by, pair_key)
      values ('dm', ${context.userId}, ${key})
      returning id
    `;
    const id = created[0]?.id;
    if (!id) throw new Error("Чат үүссэнгүй");
    await sql`
      insert into conversation_members (conversation_id, user_id, role)
      values (${id}, ${context.userId}, 'owner'), (${id}, ${data.userId}, 'member')
    `;
    return { id };
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string }) => {
    const title = input.title.trim().slice(0, 48);
    if (title.length < 2) throw new Error("Нэр хэт богино");
    return { title };
  })
  .handler(async ({ context, data }): Promise<{ id: number }> => {
    await assertRateLimit(context.userId, "group");
    const sql = await getSql();
    const created = await sql<{ id: number }>`
      insert into conversations (kind, title, created_by)
      values ('group', ${data.title}, ${context.userId})
      returning id
    `;
    const id = created[0]?.id;
    if (!id) throw new Error("Бүлэг үүссэнгүй");
    await sql`
      insert into conversation_members (conversation_id, user_id, role)
      values (${id}, ${context.userId}, 'owner')
    `;
    return { id };
  });

export const inviteToGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { conversationId: number; userId: string }) => {
    const conversationId = Number(input.conversationId);
    const userId = input.userId.trim();
    if (!Number.isInteger(conversationId) || !userId) throw new Error("Буруу");
    return { conversationId, userId };
  })
  .handler(async ({ context, data }): Promise<void> => {
    const sql = await getSql();
    const conv = await sql<{ kind: string; n: number }>`
      select c.kind, count(m.user_id)::int as n
      from conversations c
      join conversation_members me
        on me.conversation_id = c.id and me.user_id = ${context.userId}
      left join conversation_members m on m.conversation_id = c.id
      where c.id = ${data.conversationId}
      group by c.kind
    `;
    if (!conv[0] || conv[0].kind !== "group") throw new Error("Хандах эрхгүй");
    if (conv[0].n >= 50) throw new Error("Бүлэг дүүрсэн");
    const person = await sql<{ id: string }>`
      select id from "user" where id = ${data.userId} limit 1
    `;
    if (!person[0]) throw new Error("Хэрэглэгч олдсонгүй");
    await sql`
      insert into conversation_members (conversation_id, user_id, role)
      values (${data.conversationId}, ${data.userId}, 'member')
      on conflict do nothing
    `;
  });

export const listChatMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { conversationId: number }) => {
    const conversationId = Number(input.conversationId);
    if (!Number.isInteger(conversationId)) throw new Error("Чат буруу");
    return { conversationId };
  })
  .handler(async ({ context, data }): Promise<ChatMessage[]> => {
    await requireMember(data.conversationId, context.userId);
    const sql = await getSql();
    const rows = await sql<ChatMessage>`
      select id, conversation_id, user_id, author_name, body,
             attachment_kind, attachment_mime, attachment_data,
             created_at::text as created_at
      from direct_messages
      where conversation_id = ${data.conversationId}
      order by created_at asc, id asc
      limit 80
    `;
    return rows.map((r) => ({ ...r, created_at: asIso(r.created_at) }));
  });

type PostInput = {
  conversationId: number;
  body: string;
  image?: string;
  video?: string;
  videoUrl?: string;
};

export const postChatMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: PostInput) => {
    const conversationId = Number(input.conversationId);
    if (!Number.isInteger(conversationId)) throw new Error("Чат буруу");
    return {
      conversationId,
      body: sanitizeChatBody(input.body ?? ""),
      image: input.image,
      video: input.video,
      videoUrl: input.videoUrl?.trim() ?? "",
    };
  })
  .handler(async ({ context, data }): Promise<ChatMessage> => {
    await requireMember(data.conversationId, context.userId);
    await assertRateLimit(context.userId, "chat");

    let kind: string | null = null;
    let mime: string | null = null;
    let payload: string | null = null;

    const mediaCount = [data.image, data.video, data.videoUrl].filter(Boolean).length;
    if (mediaCount > 1) throw new Error("Нэг зурвас — нэг файл");

    if (data.image) {
      await assertRateLimit(context.userId, "media");
      const bytes = decodeBase64Payload(data.image, IMAGE_LIMIT);
      const info = inspectImage(bytes);
      kind = "image";
      mime = info.mime;
      payload = `data:${info.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } else if (data.video) {
      await assertRateLimit(context.userId, "media");
      const bytes = decodeBase64Payload(data.video, VIDEO_LIMIT);
      const info = inspectVideo(bytes);
      kind = "video";
      mime = info.mime;
      payload = `data:${info.mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } else if (data.videoUrl) {
      await assertRateLimit(context.userId, "media");
      const parsed = parseVideoUrl(data.videoUrl);
      kind = "video_url";
      mime = "text/uri-list";
      if (parsed.kind === "youtube") payload = youtubeEmbed(parsed.id);
      else if (parsed.kind === "vimeo") payload = vimeoEmbed(parsed.id);
      else payload = parsed.href;
    }

    if (!data.body && !payload) throw new Error("Хоосон зурвас");

    const sql = await getSql();
    const name = await displayNameFor(context.userId);
    const rows = await sql<ChatMessage>`
      insert into direct_messages (
        conversation_id, user_id, author_name, body,
        attachment_kind, attachment_mime, attachment_data
      )
      values (
        ${data.conversationId}, ${context.userId}, ${name}, ${data.body},
        ${kind}, ${mime}, ${payload}
      )
      returning id, conversation_id, user_id, author_name, body,
                attachment_kind, attachment_mime, attachment_data,
                created_at::text as created_at
    `;
    const row = rows[0];
    if (!row) throw new Error("Илгээгдсэнгүй");
    return { ...row, created_at: asIso(row.created_at) };
  });

export type ConversationMember = { id: string; name: string; role: string };

export type ConversationDetail = {
  id: number;
  kind: "dm" | "group";
  title: string;
  members: ConversationMember[];
};

export const getConversation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { conversationId: number }) => {
    const conversationId = Number(input.conversationId);
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw new Error("Чат буруу");
    }
    return { conversationId };
  })
  .handler(async ({ context, data }): Promise<ConversationDetail> => {
    await requireMember(data.conversationId, context.userId);
    const sql = await getSql();
    const conv = await sql<{ id: number; kind: "dm" | "group"; title: string | null }>`
      select id, kind, title from conversations where id = ${data.conversationId} limit 1
    `;
    const row = conv[0];
    if (!row) throw new Error("Чат олдсонгүй");
    const members = await sql<{ id: string; name: string; role: string }>`
      select u.id, u.name, cm.role
      from conversation_members cm
      join "user" u on u.id = cm.user_id
      where cm.conversation_id = ${data.conversationId}
      order by cm.joined_at asc
    `;
    const others = members.filter((m) => m.id !== context.userId);
    const title =
      row.kind === "group"
        ? row.title || "Бүлэг"
        : others[0]?.name || "Хувийн чат";
    return {
      id: row.id,
      kind: row.kind,
      title,
      members: members.map((m) => ({
        id: m.id,
        name: (m.name || "Тоглогч").slice(0, 48),
        role: m.role,
      })),
    };
  });
