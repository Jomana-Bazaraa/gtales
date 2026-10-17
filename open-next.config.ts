// Every route is dynamic, so no incremental cache (R2) is needed; keeps the free plan setup to the Worker alone.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
