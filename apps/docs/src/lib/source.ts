import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

// Single entry point for the page tree (sidebar), search index, slug lookup,
// and static params, all built from the generated .source collection.
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
