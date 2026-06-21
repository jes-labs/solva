import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";

// One docs collection. The blog moved to the marketing site (#49), so it is no
// longer here. includeProcessedMarkdown exposes the stringified MDX through
// page.data.getText("processed"), which the .md export routes and the
// "Copy as Markdown" action read for LLM-friendly docs.
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig();
