import assert from "node:assert/strict";
import test from "node:test";
import { ZinaLog } from "../dist/index.js";

test("posts logs using the ZinaLog core ingest contract", async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ status: "logged" }), { status: 200 });
  };

  const log = new ZinaLog({
    apiKey: "test-key",
    endpoint: "http://localhost:4000/",
    service: "api",
    flushIntervalMs: 60_000,
  });

  try {
    log.error("Payment failed", {
      metadata: { orderId: 123 },
      service: "billing",
      stack: "Error: Payment failed",
      fingerprint: "payment-failed",
    });
    await log.flush();
  } finally {
    log.close();
    globalThis.fetch = originalFetch;
  }

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://localhost:4000/api/logs");
  assert.deepEqual(requests[0].init.headers, {
    Authorization: "Bearer test-key",
    "Content-Type": "application/json",
  });
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    level: "error",
    message: "Payment failed",
    service: "billing",
    metadata: { orderId: 123 },
    stack: "Error: Payment failed",
    fingerprint: "payment-failed",
  });
});

test("does not throw when log delivery fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  globalThis.fetch = async () => new Response(null, { status: 500 });

  const log = new ZinaLog({
    apiKey: "test-key",
    endpoint: "http://localhost:4000",
    flushIntervalMs: 60_000,
  });

  try {
    log.info("Still safe");
    await assert.doesNotReject(() => log.flush());
  } finally {
    log.close();
    globalThis.fetch = originalFetch;
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});
