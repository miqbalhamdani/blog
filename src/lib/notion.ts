import { config } from "@/config";
import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { GetPostResult, GetPostsResult, GetRelatedPostsResult } from "@wisp-cms/client";

const notion = new Client({
  auth: config.notion.token,
});
const postsDataSourceId =
  config.notion.postsDataSourceId || "32eae4d6-4c5a-80e8-a784-000b1275e655";

type PostPreview = GetPostsResult["posts"][number];

const getPlainText = (
  items: Array<{ plain_text: string }> | undefined
): string => {
  if (!items || items.length === 0) {
    return "";
  }

  return items.map((item) => item.plain_text).join("");
};

const getNotionFileUrl = (
  prop: PageObjectResponse["properties"][string] | undefined
): string | null => {
  if (!prop || prop.type !== "files" || prop.files.length === 0) return null;
  const file = prop.files[0];
  if (file.type === "file") return file.file.url;
  if (file.type === "external") return file.external.url;
  return null;
};

const mapNotionPageToPost = (page: PageObjectResponse): PostPreview | null => {
  const titleProperty = page.properties.Title;
  const slugProperty = page.properties.Slug;
  const dateProperty = page.properties.Date;
  const tagsProperty = page.properties.Tags;
  const imageProperty = page.properties.Image;

  const title =
    titleProperty?.type === "title" ? getPlainText(titleProperty.title) : "";
  const slug =
    slugProperty?.type === "rich_text"
      ? getPlainText(slugProperty.rich_text)
      : "";

  if (!title || !slug) {
    return null;
  }

  const publishedAt = dateProperty?.type === "date" && dateProperty.date?.start
    ? new Date(dateProperty.date.start)
    : null;

  const image = getNotionFileUrl(imageProperty);

  return {
    id: page.id,
    createdAt: new Date(page.created_time),
    teamId: postsDataSourceId,
    description: null,
    title,
    slug,
    image,
    authorId: page.created_by.id,
    updatedAt: new Date(page.last_edited_time),
    publishedAt,
    author: {
      name: null,
      image: null,
    },
    tags:
      tagsProperty?.type === "multi_select"
        ? tagsProperty.multi_select.map((tag) => ({
            id: tag.id,
            name: tag.name,
          }))
        : [],
  };
};

const getAllPublishedPosts = async (): Promise<PostPreview[]> => {
  const posts: PostPreview[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: postsDataSourceId,
      page_size: 100,
      start_cursor: nextCursor,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    });

    for (const result of response.results) {
      if (!isFullPage(result)) {
        continue;
      }

      const post = mapNotionPageToPost(result);
      if (post) {
        posts.push(post);
      }
    }

    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return posts;
};

export const getNotionPosts = async ({
  limit = 6,
  page = 1,
}: {
  limit?: number | "all";
  page?: number;
} = {}): Promise<GetPostsResult> => {
  if (!config.notion.token) {
    throw new Error("NOTION_TOKEN is missing");
  }

  const allPosts = await getAllPublishedPosts();
  const safePage = Math.max(1, page);

  if (limit === "all") {
    return {
      posts: allPosts,
      pagination: {
        page: 1,
        limit,
        totalPages: 1,
        totalPosts: allPosts.length,
        nextPage: null,
        prevPage: null,
      },
    };
  }

  const totalPages = Math.max(1, Math.ceil(allPosts.length / limit));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * limit;

  return {
    posts: allPosts.slice(startIndex, startIndex + limit),
    pagination: {
      page: currentPage,
      limit,
      totalPages,
      totalPosts: allPosts.length,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
};

export const getNotionPost = async (
  slug: string
): Promise<GetPostResult> => {
  const response = await notion.dataSources.query({
    data_source_id: postsDataSourceId,
    page_size: 1,
    filter: {
      and: [
        {
          property: "Published",
          checkbox: { equals: true },
        },
        {
          property: "Slug",
          rich_text: { equals: slug },
        },
      ],
    },
  });

  const pageResult = response.results[0];
  if (!pageResult || !isFullPage(pageResult)) {
    return { post: null };
  }

  const postPreview = mapNotionPageToPost(pageResult);
  if (!postPreview) {
    return { post: null };
  }

  const markdownResponse = await notion.pages.retrieveMarkdown({
    page_id: pageResult.id,
  });

  return {
    post: {
      ...postPreview,
      content: markdownResponse.markdown,
      metadata: null,
    },
  };
};

export const getNotionRelatedPosts = async (
  slug: string,
  limit: number = 3
): Promise<GetRelatedPostsResult> => {
  const allPosts = await getAllPublishedPosts();
  const related = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, limit)
    .map((p) => ({ ...p, distance: 0 }));

  return { posts: related };
};