export const SEO_BASE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, "") || "https://chat.lunos.tech";

export interface SeoMetaInput {
  title: string;
  description: string;
  path?: string;
  image?: string;
  robots?: string;
}

export function buildSeoMeta(input: SeoMetaInput) {
  const path = input.path ?? "/";
  const url = path.startsWith("http") ? path : `${SEO_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const image = input.image ?? `${SEO_BASE_URL}/og-playground.png`;

  return {
    title: input.title,
    description: input.description,
    url,
    image,
    robots: input.robots ?? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}
