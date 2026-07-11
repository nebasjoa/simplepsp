interface RunResult {
  batchId: string;
  paymentCount: number;
  settledCount: number;
  failedCount: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  return await $fetch<RunResult>(`${config.public.gatewayUrl}/api/internal/settlements/run`, {
    method: "POST",
    headers: { "x-internal-secret": config.internalAdminSecret },
  });
});
