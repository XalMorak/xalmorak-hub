-- Community: lounge chat + game reviews (world-readable, writes scoped by user_id)

create table if not exists lounge_messages (
  id          serial primary key,
  user_id     text not null,
  author_name text not null,
  channel     text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists lounge_messages_channel_created_idx
  on lounge_messages (channel, created_at desc);

create table if not exists reviews (
  id          serial primary key,
  user_id     text not null,
  author_name text not null,
  game_slug   text not null,
  rating      int not null check (rating between 1 and 10),
  body        text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists reviews_user_game_idx on reviews (user_id, game_slug);
create index if not exists reviews_game_created_idx on reviews (game_slug, created_at desc);

insert into lounge_messages (user_id, author_name, channel, body) values
  ('seed-naran', 'Наран', 'general', 'Сайн байна уу. Шинэ улирал эхэллээ — ямар тоглоом тоглож байна?'),
  ('seed-temuulen', 'Тэмүүлэн', 'general', 'Elden Ring-ийг дахин эхэлсэн. Энэ удаа Intelligence билд хийх гэж байна.'),
  ('seed-sarnai', 'Сарнай', 'lfg', 'Baldur''s Gate 3-т хамтрагч хэрэгтэй. Тактик дуртай хүн байна уу?'),
  ('seed-bilguun', 'Билгүүн', 'lfg', 'CS2 Premier, 15k орчим. Орой 21:00-оос хойш сул.'),
  ('seed-oyunaa', 'Оюунаа', 'news', 'Hollow Knight Silksong гарсан шүү — амралтын өдрөөр сууна.'),
  ('seed-khuslen', 'Хүслэн', 'news', 'FromSoftware дараагийн тоглоомынхоо тухай юу ч хэлэхгүй хэвээр.'),
  ('seed-naran', 'Наран', 'pc', 'Cyberpunk 2077 Phantom Liberty-г max settings дээр маш гоё харагдаж байна.'),
  ('seed-temuulen', 'Тэмүүлэн', 'console', 'TOTK-г Switch дээр дуусгасан. Дараагийн Zelda хэзээ болох бол.');

insert into reviews (user_id, author_name, game_slug, rating, body) values
  ('seed-naran', 'Наран', 'elden-ring', 10, 'Нээлттэй ертөнц, тулааны нягтрал хоёулаа төгс. Boss бүр нэг сургамж.'),
  ('seed-temuulen', 'Тэмүүлэн', 'elden-ring', 9, 'Хэцүү ч шударга. Газрын зураг өөрөө шагнал.'),
  ('seed-sarnai', 'Сарнай', 'baldurs-gate-3', 10, 'Сонголт бүр үнэхээр тооцогдоно. Хамт олноороо тоглоход өөр түүх болдог.'),
  ('seed-bilguun', 'Билгүүн', 'cs2', 8, 'Буудлагын мэдрэмж цэвэр. Premier системд дасахад цаг орно.'),
  ('seed-oyunaa', 'Оюунаа', 'hades', 9, 'Дахин тоглох бүрт шинэ мэт. Хөгжим, яриа, тулаан — бүгд нийлдэг.'),
  ('seed-khuslen', 'Хүслэн', 'stardew-valley', 10, 'Амралтын хамгийн зөөлөн тоглоом. Ферм, найзууд, жижигхэн баяр.'),
  ('seed-naran', 'Наран', 'witcher-3', 9, 'Түүх, ертөнц хоёр одоо ч давтагдашгүй. Хажуугийн даалгавар нь гол шугамаас дутахгүй.'),
  ('seed-sarnai', 'Сарнай', 'hollow-knight', 9, 'Газар доорх хот, чимээгүй яруу найраг. Хэцүү, гэхдээ үзэсгэлэнтэй.');
