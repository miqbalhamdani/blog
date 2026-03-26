export const revalidate = 3600; // 1 hour

import { NextResponse } from "next/server";
import RSS from "rss";
import { getNotionPosts } from "@/lib/notion";
import { config } from "@/config";

const baseUrl = config.baseUrl;

export async function GET() {
  const result = await getNotionPosts({ limit: 20 });

  const posts = result.posts.map((post) => {
    return {
      title: post.title,
      description: post.description || "",
      url: new URL(`/blog/${post.slug}`, baseUrl).toString(),
      date: post.publishedAt || new Date(),
    };
  });

  const feed = new RSS({
    title: config.blog.name,
    description: config.blog.metadata.description,
    site_url: baseUrl,
    feed_url: new URL("/rss", baseUrl).toString(),
    pubDate: new Date(),
  });
  posts.forEach((post) => {
    feed.item(post);
  });

  const xml: string = feed.xml({ indent: true });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
