export default defineEventHandler(async (event) => {
  if (!event.path.startsWith("/api/admin/") || event.path === "/api/admin/login") return;

  const session = await getUserSession(event);
  if (session.user?.kind !== "operator") {
    throw createError({ statusCode: 401, statusMessage: "Operator login required" });
  }

  event.context.operatorId = session.user.id;
});
