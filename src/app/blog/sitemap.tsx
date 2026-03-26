import { config } from "@/config";
import { getNotionPosts } from "@/lib/notion";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await getNotionPosts({ limit: "all" });
  return [
    {
      url: new URL("/blog", config.baseUrl).toString(),
      lastModified: new Date(),
      priority: 0.8,
    },
    ...result.posts.map((post) => {
      return {
        url: new URL(`/blog/${post.slug}`, config.baseUrl).toString(),
        lastModified: new Date(post.updatedAt),
        priority: 0.8,
      };
    }),
  ];
}
