import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";

// Two collections: the docs sections and the blog. Both use the default page
// and meta schemas. Frontmatter customization would go here.
export const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

export const blog = defineDocs({
  dir: "content/blog",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

export default defineConfig();
