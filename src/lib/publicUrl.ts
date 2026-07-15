import type { BrandKey } from "@/lib/brands";
import type { BlogRow } from "@/types/blog";

// Mirrors getBaseUrlForBrand() on each brand site — canonicals are built on the
// www host, so the URL we inspect must use it too.
const BRAND_BASE_URL: Record<BrandKey, string> = {
  happy: "https://www.happy-milo.com",
  forever: "https://www.forever-milo.com",
  support: "https://www.support-milo.com",
  other: "",
};

// Apex hosts we accept for a Search Console lookup, derived from the presets
// above so a new brand only has to be declared once.
export const BRAND_APEX_HOSTS = new Set(
  Object.values(BRAND_BASE_URL)
    .filter(Boolean)
    .map((url) => new URL(url).hostname.replace(/^www\./, "")),
);

export type PageKind =
  | "blog"
  | "template"
  | "date"
  | "dateCategory"
  | "spot"
  | "spotTag";

// Route shapes come from the brand sites' app/[locale]/… tree.
const PATH_BY_KIND: Record<PageKind, (slug: string) => string> = {
  blog: (slug) => `/blog/${slug}`,
  template: (slug) => `/happy-wall/audience/${slug}`,
  date: (slug) => `/happy-dates/${slug}`,
  dateCategory: (slug) => `/happy-dates/categorie/${slug}`,
  spot: (slug) => `/happy-spots/spot/${slug}`,
  spotTag: (slug) => `/happy-spots/tag/${slug}`,
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Public canonical URL of the page a CMS row renders, or null when the row is
 * not addressable yet (no slug/language, or an unknown brand).
 */
export function buildPublicUrl(
  kind: PageKind,
  brand: BrandKey,
  row: BlogRow,
): string | null {
  const base = BRAND_BASE_URL[brand];
  const slug = str(row.slug);
  const language = str(row.language) || str(row.lang) || str(row.locale);
  if (!base || !slug || !language) return null;
  return `${base}/${language}${PATH_BY_KIND[kind](slug)}`;
}
