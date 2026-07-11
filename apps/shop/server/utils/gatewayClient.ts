import { sign } from "@simplepsp/shared/server";

export function signedHeaders(apiKey: string, secret: string, rawBody: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    "x-api-key": apiKey,
    "x-timestamp": String(timestamp),
    "x-signature": sign(secret, timestamp, rawBody),
  };
}
