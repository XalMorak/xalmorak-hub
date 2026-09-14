export const CHANNELS = [
  {
    id: "general",
    label: { mn: "Ерөнхий", en: "General" },
    blurb: {
      mn: "Юу тоглож байна, юу бодож байна.",
      en: "What you're playing, what you think.",
    },
  },
  {
    id: "lfg",
    label: { mn: "Хамтрагч", en: "Looking for group" },
    blurb: {
      mn: "Хамт тоглох хүн хайж байна уу.",
      en: "Find people to play with.",
    },
  },
  {
    id: "news",
    label: { mn: "Мэдээ", en: "News" },
    blurb: {
      mn: "Гарц, тэлэлт, цуурхал.",
      en: "Launches, expansions, rumors.",
    },
  },
  {
    id: "pc",
    label: { mn: "PC", en: "PC" },
    blurb: {
      mn: "Тохиргоо, мод, төмөр.",
      en: "Settings, mods, hardware.",
    },
  },
  {
    id: "console",
    label: { mn: "Консол", en: "Console" },
    blurb: {
      mn: "PlayStation, Xbox, Switch.",
      en: "PlayStation, Xbox, Switch.",
    },
  },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];
