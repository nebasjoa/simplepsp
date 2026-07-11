import { verify } from "@simplepsp/shared/server";
import { prisma } from "../utils/prisma";

const TIMESTAMP_SKEW_SECONDS = 300;

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/v1/")) return;

  // h3's readRawBody() rejects GET/HEAD outright (no body to read) -- treat those as an empty
  // body to sign over, matching how callers like the shop sign their GET requests.
  const rawBody = isMethod(event, ["GET", "HEAD"]) ? "" : ((await readRawBody(event)) ?? "");
  const apiKey = getHeader(event, "x-api-key");
  const timestampHeader = getHeader(event, "x-timestamp");
  const signature = getHeader(event, "x-signature");

  if (!apiKey) {
    setResponseHeader(event, "WWW-Authenticate", "Signature");
    throw createError({ statusCode: 401, statusMessage: "Missing X-Api-Key" });
  }

  const merchant = await prisma.merchant.findUnique({ where: { apiKey } });
  if (!merchant || !merchant.active) {
    setResponseHeader(event, "WWW-Authenticate", "Signature");
    throw createError({ statusCode: 401, statusMessage: "Invalid API key" });
  }

  const timestamp = Number(timestampHeader);
  if (!timestampHeader || !Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TIMESTAMP_SKEW_SECONDS) {
    throw createError({ statusCode: 401, statusMessage: "Request timestamp out of range" });
  }

  if (!signature || !verify(merchant.secret, timestamp, rawBody, signature)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid signature" });
  }

  event.context.merchant = merchant;
  event.context.rawBody = rawBody;
});
