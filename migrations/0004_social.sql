-- Profiles, friends, blocks, reports, notifications, LFG, clip gallery.

create table if not exists profiles (
  user_id     text primary key,
  bio         text not null default '',
  region      text not null default 'mn',
  avatar_mime text,
  avatar_data text,
  updated_at  timestamptz not null default now()
);

create table if not exists friendships (
  user_a       text not null,
  user_b       text not null,
  requester_id text not null,
  status       text not null check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index if not exists friendships_requester_idx on friendships (requester_id);
create index if not exists friendships_status_idx on friendships (status);

create table if not exists blocks (
  blocker_id text not null,
  blocked_id text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on blocks (blocked_id);

create table if not exists reports (
  id             serial primary key,
  reporter_id    text not null,
  target_user_id text not null,
  reason         text not null,
  body           text not null default '',
  created_at     timestamptz not null default now(),
  check (reporter_id <> target_user_id)
);

create index if not exists reports_target_idx on reports (target_user_id, created_at desc);

create table if not exists notifications (
  id         serial primary key,
  user_id    text not null,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  href       text not null default '/',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

create table if not exists lfg_posts (
  id           serial primary key,
  user_id      text not null,
  author_name  text not null,
  game_slug    text not null,
  title        text not null,
  body         text not null,
  region       text not null default 'mn',
  slots        int not null default 4 check (slots between 2 and 10),
  scheduled_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists lfg_posts_created_idx on lfg_posts (created_at desc);
create index if not exists lfg_posts_game_idx on lfg_posts (game_slug, created_at desc);

create table if not exists game_clips (
  id              serial primary key,
  user_id         text not null,
  author_name     text not null,
  game_slug       text not null,
  attachment_kind text not null check (attachment_kind in ('image', 'video', 'video_url')),
  attachment_mime text,
  attachment_data text not null,
  created_at      timestamptz not null default now()
);

create index if not exists game_clips_slug_idx on game_clips (game_slug, created_at desc);
