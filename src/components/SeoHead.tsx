import { useEffect } from "react";
import { buildSeoMeta, type SeoMetaInput } from "@/lib/seo";

function setOrCreateTag(selector: string, createTag: "meta" | "link", attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = document.createElement(createTag);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    el?.setAttribute(key, value);
  });
}

export default function SeoHead(props: SeoMetaInput) {
  useEffect(() => {
    const meta = buildSeoMeta(props);

    document.title = meta.title;
    setOrCreateTag("meta[name='description']", "meta", { name: "description", content: meta.description });
    setOrCreateTag("meta[name='robots']", "meta", { name: "robots", content: meta.robots });
    setOrCreateTag("link[rel='canonical']", "link", { rel: "canonical", href: meta.url });

    setOrCreateTag("meta[property='og:type']", "meta", { property: "og:type", content: "website" });
    setOrCreateTag("meta[property='og:site_name']", "meta", { property: "og:site_name", content: "Lunos" });
    setOrCreateTag("meta[property='og:title']", "meta", { property: "og:title", content: meta.title });
    setOrCreateTag("meta[property='og:description']", "meta", { property: "og:description", content: meta.description });
    setOrCreateTag("meta[property='og:url']", "meta", { property: "og:url", content: meta.url });
    setOrCreateTag("meta[property='og:image']", "meta", { property: "og:image", content: meta.image });
    setOrCreateTag("meta[property='og:image:alt']", "meta", { property: "og:image:alt", content: "Lunos Playground preview" });

    setOrCreateTag("meta[name='twitter:card']", "meta", { name: "twitter:card", content: "summary_large_image" });
    setOrCreateTag("meta[name='twitter:title']", "meta", { name: "twitter:title", content: meta.title });
    setOrCreateTag("meta[name='twitter:description']", "meta", { name: "twitter:description", content: meta.description });
    setOrCreateTag("meta[name='twitter:image']", "meta", { name: "twitter:image", content: meta.image });
  }, [props]);

  return null;
}
