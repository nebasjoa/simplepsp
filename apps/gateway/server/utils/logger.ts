import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOG_DIR = join(process.cwd(), "logs");

function logFilePath(now: Date): string {
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD -> one file per day
  return join(LOG_DIR, `gateway-${day}.log`);
}

// The gateway is the one hop that ever sees a full test PAN and CVC in memory (the direct
// flow's JSON body, or the hosted page's form post) - neither may be persisted, logs included.
function redactCard(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record: Record<string, unknown> = { ...(value as Record<string, unknown>) };

  if ("cardNumber" in record) {
    const digits = String(record.cardNumber ?? "").replace(/\D/g, "");
    record.cardNumber = `**** **** **** ${digits.slice(-4)}`;
  }
  if ("cvc" in record) {
    record.cvc = "***";
  }
  if (record.card && typeof record.card === "object") {
    const card = record.card as Record<string, unknown>;
    const digits = String(card.number ?? "").replace(/\D/g, "");
    record.card = { ...card, number: `**** **** **** ${digits.slice(-4)}`, cvc: "***" };
  }

  return record;
}

export function formatBody(body: unknown): string {
  if (body === undefined) return "-";
  try {
    return JSON.stringify(redactCard(body));
  } catch {
    return String(body);
  }
}

export async function logLine(message: string): Promise<void> {
  const now = new Date();
  const line = `[${now.toISOString()}] ${message}\n`;
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(logFilePath(now), line, "utf8");
  } catch (err) {
    console.error("gateway logger: failed to write log file", err);
  }
}
