export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/portal/") || event.path === "/api/portal/login") return;

  const session = await getUserSession(event);
  if (session.user?.kind !== "merchant") {
    throw createError({ statusCode: 401, statusMessage: "Merchant login required" });
  }

  event.context.merchantId = session.user.id;
});
