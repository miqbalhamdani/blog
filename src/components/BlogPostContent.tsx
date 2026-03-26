"use client";
import type { GetPostResult } from "@/lib/notion";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const PostContent = ({ content }: { content: string }) => {
  return (
    <div className="blog-content mx-auto">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export const BlogPostContent = ({ post }: { post: GetPostResult["post"] }) => {
  if (!post) return null;
  const { title, publishedAt, createdAt, content, tags, image } = post;
  return (
    <article className="prose lg:prose-xl dark:prose-invert mx-auto lg:prose-h1:text-4xl mb-10 lg:mt-10 break-words">
      <h1 className="mb-4">{title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 not-prose">
        <div className="opacity-80">
          {Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(publishedAt || createdAt))}
        </div>
        {tags.length > 0 && (
          <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        )}
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.name}`}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>

      {image && (
        <div className="relative aspect-[16/9] w-full mb-10 rounded-xl overflow-hidden shadow-sm not-prose">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <PostContent content={content} />
    </article>
  );
};
