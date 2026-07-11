import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOG_DIR = join(process.cwd(), "logs");

function logFilePath(now: Date): string {
  const day = now.toISOString().slice(0, 10); // YYYY-MM-DD -> one file per day
  return join(LOG_DIR, `acquirer-${day}.log`);
}

// The mock acquirer is the one place that ever sees a full test PAN in memory - it must
// never persist it, logs included. Only brand-identifying digits (last 4) are written out.
function redactCardNumber(value: unknown): unknown {
  if (!value || typeof value !== "object" || !("cardNumber" in value)) return value;
  const record = value as Record<string, unknown>;
  const digits = String(record.cardNumber ?? "").replace(/\D/g, "");
  return { ...record, cardNumber: `**** **** **** ${digits.slice(-4)}` };
}

export function formatBody(body: unknown): string {
  if (body === undefined) return "-";
  try {
    return JSON.stringify(redactCardNumber(body));
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
    console.error("acquirer logger: failed to write log file", err);
  }
}
