export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession();
  if (!loggedIn.value || user.value?.kind !== "operator") {
    return navigateTo("/admin/login");
  }
});
