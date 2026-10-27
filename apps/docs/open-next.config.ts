import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Prerendered pages are served from Workers Static Assets. Read-only: no ISR or
// revalidation, which this app does not use.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
