import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// Static search index built from the docs source at build time.
export const { GET } = createFromSource(source, {
  language: "english",
});
