import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: the console renders per request and uses no ISR.
export default defineCloudflareConfig();
