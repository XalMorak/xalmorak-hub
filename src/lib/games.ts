export const GENRES = [
  { id: "rpg", label: "Дүрд тоглох" },
  { id: "action", label: "Үйл явдал" },
  { id: "fps", label: "Буудалт" },
  { id: "strategy", label: "Стратеги" },
  { id: "indie", label: "Инди" },
  { id: "sim", label: "Симулятор" },
  { id: "moba", label: "MOBA" },
  { id: "adventure", label: "Адал явдал" },
] as const;

export const PLATFORMS = [
  { id: "pc", label: "PC" },
  { id: "ps", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
  { id: "switch", label: "Switch" },
  { id: "mobile", label: "Мобайл" },
] as const;

export type GenreId = (typeof GENRES)[number]["id"];
export type PlatformId = (typeof PLATFORMS)[number]["id"];
export type Motif =
  | "rings"
  | "grid"
  | "slash"
  | "orbit"
  | "bars"
  | "plus"
  | "arc"
  | "steps"
  | "diamond"
  | "wave"
  | "cross"
  | "stack"
  | "dice";

export type Game = {
  slug: string;
  title: string;
  developer: string;
  year: number;
  genres: GenreId[];
  platforms: PlatformId[];
  score: number;
  playtime: string;
  summary: string;
  body: string;
  featured?: boolean;
  motif: Motif;
  steamId?: number;
  coverUrl?: string;
};

export const GAMES: Game[] = [
  {
    slug: "elden-ring",
    title: "Elden Ring",
    developer: "FromSoftware",
    year: 2022,
    genres: ["rpg", "action"],
    platforms: ["pc", "ps", "xbox"],
    score: 96,
    playtime: "80–120 цаг",
    featured: true,
    motif: "rings",
    summary: "Lands Between-ийн нээлттэй ертөнцөд хүнд, үзэсгэлэнтэй адал явдал.",
    body: "FromSoftware Lands Between хэмээх асар том ертөнцийг нээж, тоглогчийг чиглэлгүй тэнүүчлүүлдэг. Тулаан нягт, босс бүр нэг сургамж. George R. R. Martin-ийн хамтран бүтээсэн домог зүй нь газрын хэлбэр, зэвсэг, нам гүм балгас бүрт шингэсэн. Хэцүү ч шударга — унасан бол өөр замаар оролдоорой.",
  },
  {
    slug: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    developer: "Larian Studios",
    year: 2023,
    genres: ["rpg"],
    platforms: ["pc", "ps", "xbox"],
    score: 97,
    playtime: "80–150 цаг",
    featured: true,
    motif: "dice",
    summary: "Сонголт бүр үнэхээр тооцогддог хамтын RPG.",
    body: "Larian Dungeons & Dragons-ийн дүрмийг дэлгэцэн дээр амилуулсан. Хамт олноороо тоглоход нэг кампанит ажил хэдэн өөр түүх болдог. Яриа, тулаан, хайр дурлал, урвалт — бүгд нэг ширээнд. Тактик дуртай хүнд бол энэ жилүүдийн хамгийн баян RPG.",
  },
  {
    slug: "witcher-3",
    title: "The Witcher 3",
    developer: "CD Projekt Red",
    year: 2015,
    genres: ["rpg", "adventure"],
    platforms: ["pc", "ps", "xbox", "switch"],
    score: 93,
    playtime: "50–100 цаг",
    motif: "slash",
    summary: "Геральтын сүүлчийн ан. Хажуугийн даалгавар нь гол шугамаас дутахгүй.",
    body: "Континент нь үлгэр, улс төрийн бохир тоглоом, жижиг хүмүүсийн эмгэнэлээр дүүрэн. CD Projekt Red хажуугийн түүхийг гол шугамтай эн тэнцүү бичсэн нь одоо ч стандарт. Blood and Wine тэлэлт нь өөрөө бүтэн тоглоом.",
  },
  {
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    developer: "CD Projekt Red",
    year: 2020,
    genres: ["rpg", "action"],
    platforms: ["pc", "ps", "xbox"],
    score: 86,
    playtime: "30–60 цаг",
    motif: "grid",
    summary: "Night City — гэрэл, хүчирхийлэл, санах ойн худалдаа.",
    body: "Гарсан өдрөөсөө хойш их засварласан. Одоо Night City нь нягт, аюултай, үзэсгэлэнтэй метрополис. Phantom Liberty тэлэлт нь шөнийн хотын хамгийн хурц түүхийг нэмсэн. V-гийн зам нэг биш.",
  },
  {
    slug: "red-dead-redemption-2",
    title: "Red Dead Redemption 2",
    developer: "Rockstar Games",
    year: 2018,
    genres: ["action", "adventure"],
    platforms: ["pc", "ps", "xbox"],
    score: 97,
    playtime: "50–80 цаг",
    featured: true,
    motif: "wave",
    summary: "Америкийн баруун хязгаарын сүүлчийн амьсгал.",
    body: "Arthur Morgan болон Van der Linde бүлэглэлийн уналт. Rockstar ертөнцийг тийм нарийн бүтээсэн нь морь унах, гал түлэх, хотод орох ч гэсэн кино мэт. Удаан, хүнд, мартагдашгүй.",
  },
  {
    slug: "gta-v",
    title: "Grand Theft Auto V",
    developer: "Rockstar Games",
    year: 2013,
    genres: ["action"],
    platforms: ["pc", "ps", "xbox"],
    score: 97,
    playtime: "30–50 цаг",
    motif: "stack",
    summary: "Los Santos — гурван дүр, нэг хот, хязгааргүй эмх замбараа.",
    body: "Ганц тоглогчийн түүх нь хошин, харгис, нарийн. Online нь бүхэл бүтэн арван жилийн эдийн засаг болсон. Хотын амьсгал, радио, жолоодлого — Rockstar-ийн хамгийн том тайз.",
  },
  {
    slug: "minecraft",
    title: "Minecraft",
    developer: "Mojang",
    year: 2011,
    genres: ["adventure", "sim"],
    platforms: ["pc", "ps", "xbox", "switch", "mobile"],
    score: 93,
    playtime: "Хязгааргүй",
    motif: "plus",
    summary: "Шооноос ертөнц. Бүтээ, ух, хамгаал.",
    body: "Хамгийн энгийн дүрэм, хамгийн том төсөөлөл. Ганцаараа амьд үлдэх эсвэл найзуудтайгаа хот босгох. Жил өнгөрөх тусам шинэ биом, дайснууд, түүх нэмэгдсээр. Нас хамаарахгүй.",
  },
  {
    slug: "counter-strike-2",
    title: "Counter-Strike 2",
    developer: "Valve",
    year: 2023,
    genres: ["fps"],
    platforms: ["pc"],
    score: 88,
    playtime: "Хязгааргүй",
    motif: "cross",
    summary: "Тактик буудлагын цэвэр хэлбэр.",
    body: "Нэг дугуй, нэг эдийн засаг, нэг буруу алхам. CS2 Source 2 дээр дахин төрсөн бөгөөд утаа, гэрэл, буудлагын мэдрэмжийг шинэчилсэн. Premier, Faceit, найзуудын хоорондын нэр төрийн тулаан — энэ тоглоом дуусахгүй.",
  },
  {
    slug: "league-of-legends",
    title: "League of Legends",
    developer: "Riot Games",
    year: 2009,
    genres: ["moba"],
    platforms: ["pc"],
    score: 80,
    playtime: "Хязгааргүй",
    motif: "orbit",
    summary: "Таван хүн, нэг газрын зураг, мөнхийн мета.",
    body: "Дэлхийн хамгийн том e-спортүүдийн нэг. Аваргууд солигдож, улирал солигддог ч Summoner's Rift хэвээр. Хамт олноороо сурах нь хэцүү, ялах нь донтмоор.",
  },
  {
    slug: "valorant",
    title: "Valorant",
    developer: "Riot Games",
    year: 2020,
    genres: ["fps"],
    platforms: ["pc", "ps", "xbox"],
    score: 84,
    playtime: "Хязгааргүй",
    motif: "bars",
    summary: "Агент, чадвар, цэвэр буудалт.",
    body: "Тактик шутер дээр чадварын давхарга нэмсэн. Дугуй бүр мэдээлэл, дуу, байрлал. Тэмцээн, акт бүр шинэ агент, газрын зураг авчирдаг. Нарийвчлал шаардана.",
  },
  {
    slug: "hades",
    title: "Hades",
    developer: "Supergiant Games",
    year: 2020,
    genres: ["action", "indie"],
    platforms: ["pc", "ps", "xbox", "switch"],
    score: 93,
    playtime: "20–40 цаг",
    featured: true,
    motif: "arc",
    summary: "Тамын хүүгийн дахин дахин босох оролдлого.",
    body: "Унасан бол түүх үргэлжилнэ. Supergiant roguelike-ийг яриа, хөгжим, тулааны урсгалтай хольсон. Зевс, Афина, Мегера — олимп бүр нэг бэлэг, нэг нууц. Silksong шиг биш, гэхдээ адилхан донтмоор.",
  },
  {
    slug: "stardew-valley",
    title: "Stardew Valley",
    developer: "ConcernedApe",
    year: 2016,
    genres: ["sim", "indie"],
    platforms: ["pc", "ps", "xbox", "switch", "mobile"],
    score: 91,
    playtime: "40–80 цаг",
    motif: "steps",
    summary: "Хотыг орхиод фермд ир. Ургац, найз, жижигхэн баяр.",
    body: "Нэг хүн бүтээсэн тоглоом ингэж дулаахан байж болдог. Улирал солигдож, хөршүүд нээгдэж, уурхай гүнзгийрнэ. Яарна гэж байхгүй. Хамт олноороо ферм барихад бүр илүү.",
  },
  {
    slug: "zelda-tears-of-the-kingdom",
    title: "Zelda: Tears of the Kingdom",
    developer: "Nintendo",
    year: 2023,
    genres: ["adventure", "action"],
    platforms: ["switch"],
    score: 96,
    playtime: "50–80 цаг",
    motif: "diamond",
    summary: "Тэнгэр, газар, газар доор — Hyrule дахин нээгдлээ.",
    body: "Breath of the Wild-ийн ертөнц дээр тэнгэрийн арлууд, гүн уурхай нэмэгдсэн. Ultrahand-аар юу ч барь. Puzzle нь тоглогчийн төсөөллийг шагнадаг, заадаггүй. Nintendo-гийн хамгийн чөлөөт адал явдал.",
  },
  {
    slug: "god-of-war-ragnarok",
    title: "God of War Ragnarök",
    developer: "Santa Monica Studio",
    year: 2022,
    genres: ["action", "adventure"],
    platforms: ["ps", "pc"],
    score: 94,
    playtime: "25–40 цаг",
    motif: "slash",
    summary: "Кратос, Атреус, өвлийн төгсгөл.",
    body: "Эцэг хүүгийн түүх норвегийн домог дунд үргэлжилнэ. Тулаан хүнд, яриа нарийн. едва нэг шидэлт ч өгүүлэмжийн хэмнэлийг эвддэггүй. Кино биш — гарт багтах туульс.",
  },
  {
    slug: "hollow-knight",
    title: "Hollow Knight",
    developer: "Team Cherry",
    year: 2017,
    genres: ["adventure", "indie"],
    platforms: ["pc", "ps", "xbox", "switch"],
    score: 90,
    playtime: "25–40 цаг",
    motif: "orbit",
    summary: "Hallownest-ийн чимээгүй яруу найраг.",
    body: "Газар доорх хаант улс үзэсгэлэнтэй, аюултай, ганцаардмал. Метроидваниагийн газрын зураг нь өөрөө шагнал. Хөгжим, тулаан, жижигхэн шавжны эмгэнэл — бүгд нэг аялгуунд. Silksong энэ суурин дээр боссон.",
  },
  {
    slug: "black-myth-wukong",
    title: "Black Myth: Wukong",
    developer: "Game Science",
    year: 2024,
    genres: ["action", "rpg"],
    platforms: ["pc", "ps"],
    score: 82,
    playtime: "30–45 цаг",
    motif: "rings",
    summary: "Сун Укун, домог, хүнд тулаан.",
    body: "Баруун Жорныг үйл явдлын тоглоом болгосон. Босс нь үзэсгэлэнтэй, хэцүү. Хятадын домог зүйг дэлхийд ийм өргөн харуулсан нь ховор. Зарим систем түүхийг гүйцэхгүй ч тайз нь мартагдашгүй.",
  },
  {
    slug: "the-last-of-us",
    title: "The Last of Us Part I",
    developer: "Naughty Dog",
    year: 2022,
    genres: ["adventure", "action"],
    platforms: ["pc", "ps"],
    score: 95,
    playtime: "12–18 цаг",
    motif: "wave",
    summary: "Жоэл, Элли, дууссан ертөнцийн зам.",
    body: "Халдварын дараах Америк. Naughty Dog тоглоомыг жүжиг мэт найруулдаг: чимээгүй алхаа, гэнэтийн тулаан, хэлэхгүй үлдсэн үгс. Remake нь дүр төрх, сонсголыг шинэчилсэн ч цөм нь хэвээр — хоёр хүн, нэг амлалт.",
  },
  {
    slug: "dota-2",
    title: "Dota 2",
    developer: "Valve",
    year: 2013,
    genres: ["moba", "strategy"],
    platforms: ["pc"],
    score: 90,
    playtime: "Хязгааргүй",
    motif: "grid",
    summary: "Хамгийн гүн MOBA. The International жил бүр.",
    body: "Баатрын тоо, эдийн засаг, газрын хяналт — сурах муруй өндөр. Ялсан тоглоом нь шатрын мэт санагддаг. Үнэгүй, гэхдээ цаг чинь үнэ. Хамт олон, тэмцээн, Battle Pass — Valve-ийн хамгийн удаан амьд зүйл.",
  },
];

export function getGame(slug: string): Game | undefined {
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return undefined;
  const steamId = STEAM_IDS[game.slug];
  if (!steamId) return game;
  return {
    ...game,
    steamId,
    coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/header.jpg`,
  };
}

export function featuredGames(): Game[] {
  return GAMES.filter((g) => g.featured);
}

export function genreLabel(id: GenreId): string {
  return GENRES.find((g) => g.id === id)?.label ?? id;
}

export function platformLabel(id: PlatformId): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export const STEAM_IDS: Record<string, number> = {
  "elden-ring": 1245620,
  "baldurs-gate-3": 1086940,
  "witcher-3": 292030,
  "cyberpunk-2077": 1091500,
  "red-dead-redemption-2": 1174180,
  "gta-v": 271590,
  "counter-strike-2": 730,
  hades: 1145360,
  "stardew-valley": 413150,
  "god-of-war-ragnarok": 2322010,
  "hollow-knight": 367520,
  "black-myth-wukong": 2358720,
  "the-last-of-us": 1888930,
  "dota-2": 570,
};

