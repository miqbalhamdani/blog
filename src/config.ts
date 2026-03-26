const buildConfig = () => {
  const name = process.env.NEXT_PUBLIC_BLOG_DISPLAY_NAME || "Travel.";
  const copyright = process.env.NEXT_PUBLIC_BLOG_COPYRIGHT || "Samantha";
  const defaultTitle =
    process.env.NEXT_DEFAULT_METADATA_DEFAULT_TITLE || "Travel with Samantha";
  const defaultDescription = process.env.NEXT_PUBLIC_BLOG_DESCRIPTION || "Blog about travel and lifestyle.";

  return {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    blog: {
      name,
      copyright,
      metadata: {
        title: {
          absolute: defaultTitle,
          default: defaultTitle,
          template: `%s - ${defaultTitle}`,
        },
        description: defaultDescription,
      },
    },
    ogImageSecret:
      process.env.OG_IMAGE_SECRET ||
      "secret_used_for_signing_and_verifying_the_og_image_url",
    notion: {
      token: process.env.NOTION_TOKEN,
      postsDataSourceId: process.env.NOTION_POSTS_DATA_SOURCE_ID,
    },
  };
};

export const config = buildConfig();
