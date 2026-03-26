import type { MetadataRoute } from "next";
import { config } from "@/config";
import { getNotionTags } from "@/lib/notion";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await getNotionTags();
  return [
    {
      url: new URL("/tag", config.baseUrl).toString(),
      lastModified: new Date(),
      priority: 0.8,
    },
    ...result.tags.map((tag) => {
      return {
        url: new URL(`/tag/${encodeURIComponent(tag.name)}`, config.baseUrl).toString(),
        lastModified: new Date(),
        priority: 0.8,
      };
    }),
  ];
}
