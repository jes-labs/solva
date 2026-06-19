import { docs, blog } from "collections/server";
import { loader } from "fumadocs-core/source";
import { docsRoute, blogRoute } from "./shared";

// Two loaders, one per collection. See
// https://fumadocs.dev/docs/headless/source-api
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});

export const blogSource = loader({
  baseUrl: blogRoute,
  source: blog.toFumadocsSource(),
});
