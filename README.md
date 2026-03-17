Node.js SDK for [Zinalog](https://zinalog.com) — send logs from your Node.js app to your Zinalog instance.

## Installation

```bash
npm install zinalog-node
```

## Usage

```ts
import { ZinaLog } from "@zinalog/node";

const log = new ZinaLog({
  apiKey: process.env.ZINALOG_API_KEY,
  endpoint: "https://your-zinalog-instance.com",
  service: "my-app",
});

log.info("Server started");
log.warn("High memory usage", { metadata: { mem: "85%" } });
log.error("Request failed", { stack: err.stack, metadata: { userId: 42 } });
log.debug("Query executed", { metadata: { duration_ms: 12 } });
```

## Options

| Option | Type | Required | Description |
|---|---|---|---|
| `apiKey` | `string` | ✅ | Your Zinalog API key |
| `endpoint` | `string` | ✅ | Base URL of your Zinalog instance |
| `service` | `string` | — | Service name attached to every log |
| `batchSize` | `number` | — | Flush immediately when queue hits this size (default: `50`) |
| `flushIntervalMs` | `number` | — | How often the queue is flushed in ms (default: `100`) |

## Log methods

| Method | Level sent |
|---|---|
| `log.info(msg, opts?)` | `info` |
| `log.warn(msg, opts?)` | `warning` |
| `log.error(msg, opts?)` | `error` |
| `log.debug(msg, opts?)` | `debug` |

Each method accepts an optional second argument `{ metadata, stack }`.

## Manual flush

Logs are flushed automatically on an interval. Call `flush()` explicitly before process exit if needed:

```ts
await log.flush();
```

## Requirements

Node.js ≥ 20
