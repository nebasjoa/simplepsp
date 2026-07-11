import { timingSafeEqual } from "node:crypto";

export default defineEventHandler((event) => {
  if (!event.path.startsWith("/api/internal/")) return;

  const config = useRuntimeConfig();
  const provided = getHeader(event, "x-internal-secret") ?? "";
  const expected = config.internalAdminSecret;

  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (!expected || !match) {
    throw createError({ statusCode: 401, statusMessage: "Invalid internal secret" });
  }
});
