import { describe, expect, it } from "vitest";

import {
  evaluateStagingGuard,
  type StagingGuardInput,
} from "@/lib/account-reauth/staging-guard";

const approvedHostnames = ["brainiacs-staging.example.com"] as const;

function createFixture(
  overrides: Partial<StagingGuardInput> = {},
): StagingGuardInput {
  return {
    nodeEnv: "development",
    vercelEnv: "preview",
    localTestFixture: "false",
    hostname: approvedHostnames[0],
    allowedHostnames: approvedHostnames,
    featureFlag: "true",
    googleClientId: "staging-client-id",
    googleClientSecret: "test-only-placeholder",
    googleRedirectUri: "https://brainiacs-staging.example.com/auth/delete-reauth/callback",
    ...overrides,
  };
}

describe("evaluateStagingGuard", () => {
  it("rejects production before evaluating the remaining configuration", () => {
    expect(
      evaluateStagingGuard(
        createFixture({
          nodeEnv: "production",
          vercelEnv: "production",
          hostname: "attacker.example.com",
          featureFlag: "false",
          googleClientId: "",
          googleClientSecret: "",
          googleRedirectUri: "",
        }),
      ),
    ).toEqual({ allowed: false, reason: "production" });
  });

  it("rejects a missing feature flag", () => {
    expect(evaluateStagingGuard(createFixture({ featureFlag: "false" }))).toEqual({
      allowed: false,
      reason: "feature-disabled",
    });
  });

  it("rejects missing Google configuration", () => {
    expect(evaluateStagingGuard(createFixture({ googleClientSecret: "" }))).toEqual({
      allowed: false,
      reason: "google-configuration-missing",
    });
  });

  it("rejects an unknown hostname", () => {
    expect(
      evaluateStagingGuard(createFixture({ hostname: "other.example.com" })),
    ).toEqual({ allowed: false, reason: "hostname-not-allowed" });
  });

  it("allows an approved Vercel Preview configuration", () => {
    expect(evaluateStagingGuard(createFixture())).toEqual({ allowed: true });
  });

  it("allows an explicitly approved local test fixture", () => {
    expect(
      evaluateStagingGuard(
        createFixture({
          nodeEnv: "test",
          vercelEnv: undefined,
          localTestFixture: "true",
          hostname: "localhost",
          allowedHostnames: ["localhost"],
        }),
      ),
    ).toEqual({ allowed: true });
  });

  it.each([
    { name: "unexpected NODE_ENV", input: { nodeEnv: "staging" } },
    { name: "unexpected Vercel environment", input: { vercelEnv: "development" } },
    { name: "non-string feature flag", input: { featureFlag: true } },
    { name: "hostname with a port", input: { hostname: "brainiacs-staging.example.com:443" } },
    { name: "uppercase local fixture flag", input: { nodeEnv: "test", vercelEnv: undefined, localTestFixture: "TRUE" } },
  ])("rejects $name", ({ input }) => {
    expect(evaluateStagingGuard(createFixture(input))).toEqual(
      expect.objectContaining({ allowed: false }),
    );
  });
});
