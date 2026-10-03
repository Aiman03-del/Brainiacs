export interface StagingGuardInput {
  nodeEnv: unknown;
  vercelEnv?: unknown;
  localTestFixture?: unknown;
  hostname: unknown;
  allowedHostnames: readonly string[];
  featureFlag: unknown;
  googleClientId: unknown;
  googleClientSecret: unknown;
  googleRedirectUri: unknown;
}

export type StagingGuardReason =
  | "production"
  | "invalid-environment"
  | "unrecognized-deployment"
  | "hostname-not-allowed"
  | "feature-disabled"
  | "google-configuration-missing";

export type StagingGuardResult =
  | { allowed: true }
  | { allowed: false; reason: StagingGuardReason };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function evaluateStagingGuard(input: StagingGuardInput): StagingGuardResult {
  if (input.nodeEnv === "production" || input.vercelEnv === "production") {
    return { allowed: false, reason: "production" };
  }

  if (
    input.nodeEnv !== "development" &&
    input.nodeEnv !== "test" &&
    input.nodeEnv !== "production"
  ) {
    return { allowed: false, reason: "invalid-environment" };
  }

  const isVercelPreview = input.vercelEnv === "preview";
  const isApprovedLocalFixture =
    input.nodeEnv === "test" && input.localTestFixture === "true";

  if (!isVercelPreview && !isApprovedLocalFixture) {
    return { allowed: false, reason: "unrecognized-deployment" };
  }

  if (
    typeof input.hostname !== "string" ||
    !input.allowedHostnames.includes(input.hostname)
  ) {
    return { allowed: false, reason: "hostname-not-allowed" };
  }

  if (input.featureFlag !== "true") {
    return { allowed: false, reason: "feature-disabled" };
  }

  if (
    !isNonEmptyString(input.googleClientId) ||
    !isNonEmptyString(input.googleClientSecret) ||
    !isNonEmptyString(input.googleRedirectUri)
  ) {
    return { allowed: false, reason: "google-configuration-missing" };
  }

  return { allowed: true };
}
