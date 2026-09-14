export const REGIONS = [
  { id: "mn", mn: "Монгол", en: "Mongolia" },
  { id: "asia", mn: "Ази", en: "Asia" },
  { id: "eu", mn: "Европ", en: "Europe" },
  { id: "na", mn: "Хойд Америк", en: "North America" },
  { id: "sa", mn: "Өмнөд Америк", en: "South America" },
  { id: "oce", mn: "Номхон далай", en: "Oceania" },
  { id: "other", mn: "Бусад", en: "Other" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export function isRegion(value: string): value is RegionId {
  return REGIONS.some((r) => r.id === value);
}

export function regionLabel(id: string, locale: "mn" | "en"): string {
  const row = REGIONS.find((r) => r.id === id);
  if (!row) return id;
  return locale === "mn" ? row.mn : row.en;
}
