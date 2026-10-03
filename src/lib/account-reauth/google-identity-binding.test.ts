import { describe, expect, it, vi } from "vitest";

import {
  bindGoogleIdentity,
  type AdminUserLookupResult,
  type AuthenticatedUserLookupResult,
} from "@/lib/account-reauth/google-identity-binding";

const authenticatedUserId = "auth-user-123";
const trustedGoogleSubject = "google-subject-123";

function authenticatedResult(
  user: unknown = { id: authenticatedUserId },
  error: unknown = null,
): AuthenticatedUserLookupResult {
  return { data: { user }, error };
}

function adminResult(
  user: unknown,
  error: unknown = null,
): AdminUserLookupResult {
  return { data: { user }, error };
}

function googleIdentity(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: authenticatedUserId,
    user_id: authenticatedUserId,
    identity_id: "identity-123",
    provider: "google",
    identity_data: {
      sub: trustedGoogleSubject,
      email: "account@example.com",
      email_verified: true,
    },
    ...overrides,
  };
}

function adminUser(
  identities: unknown[] = [googleIdentity()],
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: authenticatedUserId,
    identities,
    ...overrides,
  };
}

function createLookups(
  authenticated: AuthenticatedUserLookupResult = authenticatedResult(),
  admin: AdminUserLookupResult = adminResult(adminUser()),
) {
  return {
    getAuthenticatedUser: vi.fn(async () => authenticated),
    getAdminUserById: vi.fn(async () => admin),
  };
}

async function bind(
  lookups = createLookups(),
  validatedGoogleSubject: unknown = trustedGoogleSubject,
) {
  return bindGoogleIdentity({
    ...lookups,
    validatedGoogleSubject,
  });
}

describe("bindGoogleIdentity", () => {
  it("accepts exactly one matching server-side Google identity", async () => {
    const lookups = createLookups();

    await expect(bind(lookups)).resolves.toEqual({
      valid: true,
      authenticatedUserId,
    });
    expect(lookups.getAdminUserById).toHaveBeenCalledExactlyOnceWith(
      authenticatedUserId,
    );
  });

  it("uses only the authenticated server-side user ID for Admin lookup", async () => {
    const lookups = createLookups();

    await bind(lookups);

    expect(lookups.getAdminUserById).toHaveBeenCalledWith(authenticatedUserId);
    expect(lookups.getAdminUserById).not.toHaveBeenCalledWith("client-user-id");
  });

  it("rejects an authenticated-user lookup error or missing user", async () => {
    const lookupError = await bind(
      createLookups(authenticatedResult(null, new Error("lookup failed"))),
    );
    const missingUser = await bind(createLookups(authenticatedResult(null)));

    expect(lookupError).toEqual({
      valid: false,
      reason: "authenticated-user-lookup-failed",
    });
    expect(missingUser).toEqual({
      valid: false,
      reason: "authenticated-user-missing",
    });
  });

  it("rejects a malformed authenticated user", async () => {
    const result = await bind(createLookups(authenticatedResult({ id: 123 })));

    expect(result).toEqual({
      valid: false,
      reason: "authenticated-user-malformed",
    });
  });

  it("rejects an unavailable or missing Admin user", async () => {
    const lookupError = await bind(
      createLookups(authenticatedResult(), adminResult(null, new Error("admin failed"))),
    );
    const missingUser = await bind(createLookups(authenticatedResult(), adminResult(null)));

    expect(lookupError).toEqual({
      valid: false,
      reason: "admin-user-lookup-failed",
    });
    expect(missingUser).toEqual({
      valid: false,
      reason: "admin-user-missing",
    });
  });

  it("rejects a malformed or mismatched Admin user", async () => {
    const malformed = await bind(
      createLookups(authenticatedResult(), adminResult({ id: 123 })),
    );
    const mismatch = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity()], { id: "different-user" })),
      ),
    );

    expect(malformed).toEqual({ valid: false, reason: "admin-user-malformed" });
    expect(mismatch).toEqual({ valid: false, reason: "admin-user-mismatch" });
  });

  it.each([
    { name: "missing identities", identities: undefined },
    { name: "null identities", identities: null },
    { name: "non-array identities", identities: "not-an-array" },
    { name: "malformed identity entry", identities: [{ provider: 42 }] },
  ])("rejects $name", async ({ identities }) => {
    const result = await bind(
      createLookups(authenticatedResult(), adminResult({ id: authenticatedUserId, identities })),
    );

    expect(result).toEqual({ valid: false, reason: "identities-malformed" });
  });

  it("rejects a missing Google identity", async () => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([{ provider: "email", user_id: authenticatedUserId }])),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "google-identity-missing" });
  });

  it("rejects duplicate Google identities", async () => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity(), googleIdentity({ identity_id: "identity-456" })])),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "google-identity-ambiguous" });
  });

  it("rejects a Google identity belonging to another user", async () => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity({ user_id: "other-user" })])),
      ),
    );

    expect(result).toEqual({
      valid: false,
      reason: "google-identity-user-mismatch",
    });
  });

  it.each([
    { name: "missing identity_data", identityData: undefined },
    { name: "null identity_data", identityData: null },
    { name: "array identity_data", identityData: [] },
    { name: "scalar identity_data", identityData: "not-an-object" },
  ])("rejects $name", async ({ identityData }) => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity({ identity_data: identityData })])),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "identity-data-malformed" });
  });

  it.each([
    { name: "missing subject", subject: undefined },
    { name: "empty subject", subject: "" },
    { name: "whitespace subject", subject: "   " },
    { name: "non-string subject", subject: 123 },
  ])("rejects $name", async ({ subject }) => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity({ identity_data: { sub: subject } })])),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "identity-subject-invalid" });
  });

  it("rejects a mismatching Google subject", async () => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(adminUser([googleIdentity({ identity_data: { sub: "other-subject" } })])),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "identity-subject-mismatch" });
  });

  it("does not use email as identity proof", async () => {
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(
          adminUser([
            googleIdentity({
              identity_data: {
                sub: "other-subject",
                email: "account@example.com",
                email_verified: true,
              },
            }),
          ]),
        ),
      ),
    );

    expect(result).toEqual({ valid: false, reason: "identity-subject-mismatch" });
  });

  it("rejects an invalid validated token subject", async () => {
    const lookups = createLookups();
    const result = await bind(lookups, "");

    expect(result).toEqual({ valid: false, reason: "invalid-token-subject" });
    expect(lookups.getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it("does not leak raw token or identity payload data in results", async () => {
    const rawSubject = "raw-subject-must-not-leak";
    const rawEmail = "private-account@example.com";
    const result = await bind(
      createLookups(
        authenticatedResult(),
        adminResult(
          adminUser([
            googleIdentity({
              identity_data: { sub: "different-subject", email: rawEmail },
            }),
          ]),
        ),
      ),
      rawSubject,
    );

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(rawSubject);
    expect(serialized).not.toContain(rawEmail);
  });
});
