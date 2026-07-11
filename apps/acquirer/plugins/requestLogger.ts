import { formatBody, logLine } from "../utils/logger";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", async (event) => {
    event.context.requestStartedAt = Date.now();

    let body: unknown;
    if (event.method !== "GET" && event.method !== "HEAD") {
      try {
        body = await readBody(event);
      } catch {
        body = undefined;
      }
    }

    await logLine(`REQUEST  ${event.method} ${event.path} body=${formatBody(body)}`);
  });

  nitroApp.hooks.hook("afterResponse", async (event, response) => {
    const startedAt = event.context.requestStartedAt as number | undefined;
    const durationMs = startedAt !== undefined ? Date.now() - startedAt : "?";
    const status = event.node.res.statusCode;
    await logLine(
      `RESPONSE ${event.method} ${event.path} ${status} ${durationMs}ms body=${formatBody(response?.body)}`,
    );
  });

  nitroApp.hooks.hook("error", async (error, context) => {
    const event = context.event;
    await logLine(`ERROR    ${event?.method ?? "?"} ${event?.path ?? "?"} ${error.message}`);
  });
});
