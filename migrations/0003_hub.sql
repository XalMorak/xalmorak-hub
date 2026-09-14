-- Private/group chat, wishlists, rate limits. Membership-scoped in app queries.

create table if not exists conversations (
  id          serial primary key,
  kind        text not null check (kind in ('dm', 'group')),
  title       text,
  created_by  text not null,
  pair_key    text unique,
  created_at  timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id int not null references conversations(id) on delete cascade,
  user_id         text not null,
  role            text not null default 'member' check (role in ('owner', 'member')),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx
  on conversation_members (user_id);

create table if not exists direct_messages (
  id               serial primary key,
  conversation_id  int not null references conversations(id) on delete cascade,
  user_id          text not null,
  author_name      text not null,
  body             text not null default '',
  attachment_kind  text,
  attachment_mime  text,
  attachment_data  text,
  created_at       timestamptz not null default now(),
  constraint direct_messages_kind_chk check (
    attachment_kind is null or attachment_kind in ('image', 'video', 'video_url')
  )
);

create index if not exists direct_messages_conv_created_idx
  on direct_messages (conversation_id, created_at asc, id asc);

create table if not exists wishlists (
  user_id    text not null,
  game_slug  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

create table if not exists rate_events (
  id         serial primary key,
  user_id    text not null,
  kind       text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_events_user_kind_time_idx
  on rate_events (user_id, kind, created_at desc);
