import { customerHasPaidPlan } from "@/server/billing/subscription";
import { AppError } from "@/server/lib/errors";
import {
  getOptionalEnvValue,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";

/**
 * AI Visibility fans out to several paid DataForSEO endpoints.
 *
 * Hosted OpenSEO reserves it for paid plans. Self-hosted deployments pay
 * DataForSEO directly, so they are intentionally not plan-gated here.
 */
export async function assertAiVisibilityAccess(
  organizationId: string,
): Promise<void> {
  if (!(await getOptionalEnvValue("DATAFORSEO_API_KEY"))) {
    throw new AppError(
      "AUTH_CONFIG_MISSING",
      "DATAFORSEO_API_KEY is not configured. Set it to base64(login:password) before using AI Visibility.",
    );
  }

  if (!(await isHostedServerAuthMode())) return;
  if (await customerHasPaidPlan(organizationId)) return;
  throw new AppError(
    "PAYMENT_REQUIRED",
    "Upgrade to the paid plan to use AI Visibility",
  );
}
