import "dotenv/config";
import { ZinaLog } from "../dist/index.js";

const apiKey = process.env.ZINALOG_API_KEY;

if (!apiKey) {
  throw new Error("Missing ZINALOG_API_KEY environment variable");
}

const log = new ZinaLog({
  apiKey,
  endpoint: process.env.ZINALOG_ENDPOINT ?? "http://localhost:3001",
  service: "test-app",
});

log.info("SDK working");
log.error("Something broke", {
  metadata: { test: true },
});
log.debug("Debugging info", {
  metadata: { debug: true },
});
log.warn("This is a warning", {
  metadata: { warning: true },
});

await log.flush();
