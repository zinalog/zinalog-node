export type ZinaLogOptions = {
  apiKey: string;
  endpoint: string;
  service?: string;
  /** Max number of queued logs before an immediate flush. Default: 50 */
  batchSize?: number;
  /** Interval in ms at which queued logs are flushed. Default: 100 */
  flushIntervalMs?: number;
};

export type LogOptions = {
  metadata?: unknown;
  service?: string;
  stack?: string;
  fingerprint?: string;
};

type LogEntry = {
  level: "info" | "warning" | "error" | "debug";
  message: string;
  service?: string;
  metadata?: unknown;
  stack?: string;
  fingerprint?: string;
};

export class ZinaLog {
  private apiKey: string;
  private endpoint: string;
  private service?: string;
  private batchSize: number;
  private queue: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: ZinaLogOptions) {
    if (!options.apiKey) throw new Error("ZinaLog: apiKey is required");
    if (!options.endpoint) throw new Error("ZinaLog: endpoint is required");
    try {
      new URL(options.endpoint);
    } catch {
      throw new Error("ZinaLog: endpoint must be a valid URL");
    }

    this.apiKey = options.apiKey;
    this.endpoint = options.endpoint.replace(/\/$/, "");
    this.service = options.service;
    this.batchSize = options.batchSize ?? 50;

    const flushIntervalMs = options.flushIntervalMs ?? 100;
    this.flushTimer = setInterval(() => this.flush(), flushIntervalMs);
    // Don't keep the process alive just for logging
    this.flushTimer.unref();
  }

  private enqueue(
    level: LogEntry["level"],
    message: string,
    options?: LogOptions
  ): void {
    const entry: LogEntry = {
      level,
      message,
      service: options?.service ?? this.service,
      metadata: options?.metadata,
      stack: options?.stack,
      fingerprint: options?.fingerprint,
    };

    this.queue.push(entry);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private async sendOne(entry: LogEntry): Promise<void> {
    const res = await fetch(`${this.endpoint}/api/logs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);

    await Promise.all(
      batch.map(async (entry) => {
        try {
          await this.sendOne(entry);
        } catch (err) {
          // do NOT crash the app
          if (process.env.NODE_ENV !== "production") {
            console.error("ZinaLog error:", err);
          }
        }
      })
    );
  }

  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  info(message: string, options?: LogOptions): void {
    this.enqueue("info", message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.enqueue("warning", message, options);
  }

  error(message: string, options?: LogOptions): void {
    this.enqueue("error", message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this.enqueue("debug", message, options);
  }
}
