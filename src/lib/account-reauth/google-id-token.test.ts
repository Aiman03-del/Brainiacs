import { generateKeyPair } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import type { JWTHeaderParameters, KeyInput } from "jose";

import {
  GOOGLE_ISSUER,
  validateGoogleIdToken,
  type GoogleJwksResolver,
} from "@/lib/account-reauth/google-id-token";

const nowMs = 1_700_000_000_000;
const nowSeconds = nowMs / 1000;
const expectedClientId = "staging-client-id";
const expectedNonce = "1234567890123456789012345678901234567890123";

let signingKey: KeyInput;
let verificationKey: KeyInput;
let wrongSigningKey: KeyInput;

beforeAll(async () => {
  ({ privateKey: signingKey, publicKey: verificationKey } =
    await generateKeyPair("RS256"));
  ({ privateKey: wrongSigningKey } = await generateKeyPair("RS256"));
});

function createResolver(key: KeyInput = verificationKey): GoogleJwksResolver {
  return vi.fn(async (header) => {
    if (header.kid !== "test-key") return null;
    return key;
  });
}

async function createToken(
  claims: Record<string, unknown> = {},
  header: JWTHeaderParameters = { alg: "RS256", kid: "test-key" },
  key: KeyInput = signingKey,
): Promise<string> {
  return new SignJWT({
    iss: GOOGLE_ISSUER,
    aud: expectedClientId,
    nonce: expectedNonce,
    sub: "google-subject-123",
    iat: nowSeconds,
    exp: nowSeconds + 300,
    auth_time: nowSeconds,
    ...claims,
  })
    .setProtectedHeader(header)
    .sign(key);
}

function validate(token: unknown, resolveKey = createResolver()) {
  return validateGoogleIdToken({
    token,
    resolveKey,
    expectedClientId,
    expectedNonce,
    freshnessWindowMs: 5 * 60 * 1000,
    clock: () => nowMs,
  });
}

describe("validateGoogleIdToken", () => {
  it("accepts a valid signed Google ID token", async () => {
    const result = await validate(await createToken());

    expect(result).toEqual({
      valid: true,
      claims: {
        subject: "google-subject-123",
        issuedAt: nowSeconds,
        expiresAt: nowSeconds + 300,
        authenticatedAt: nowSeconds,
      },
    });
  });

  it("uses only the injected key resolver and never performs network access", async () => {
    const resolveKey = createResolver();
    const result = await validate(await createToken(), resolveKey);

    expect(result.valid).toBe(true);
    expect(resolveKey).toHaveBeenCalledWith({ alg: "RS256", kid: "test-key" });
  });

  it("rejects an invalid signature", async () => {
    const result = await validate(await createToken({}, undefined, wrongSigningKey));

    expect(result).toEqual({
      valid: false,
      reason: "signature-or-claims-invalid",
    });
  });

  it("rejects an unsupported algorithm before resolving a key", async () => {
    const resolveKey = createResolver();
    const token = "eyJhbGciOiJIUzI1NiIsImtpZCI6InRlc3Qta2V5In0.invalid.invalid";

    const result = await validate(token, resolveKey);

    expect(result).toEqual({ valid: false, reason: "unsupported-algorithm" });
    expect(resolveKey).not.toHaveBeenCalled();
  });

  it.each([
    { name: "missing kid", header: { alg: "RS256" } },
    { name: "empty kid", header: { alg: "RS256", kid: "" } },
    { name: "invalid kid characters", header: { alg: "RS256", kid: "key/with/slash" } },
  ])("rejects $name", async ({ header }) => {
    const resolveKey = createResolver();
    const token = await createToken({}, header);

    const result = await validate(token, resolveKey);

    expect(result).toEqual({ valid: false, reason: "invalid-key-id" });
    expect(resolveKey).not.toHaveBeenCalled();
  });

  it.each([
    { name: "wrong issuer", claims: { iss: "https://accounts.google.com.evil" } },
    { name: "missing issuer", claims: { iss: undefined } },
    { name: "wrong audience", claims: { aud: "another-client-id" } },
    { name: "missing audience", claims: { aud: undefined } },
  ])("rejects $name", async ({ claims }) => {
    const result = await validate(await createToken(claims));

    expect(result).toEqual({
      valid: false,
      reason: "signature-or-claims-invalid",
    });
  });

  it("requires azp to identify the expected client for multiple audiences", async () => {
    const valid = await validate(
      await createToken({
        aud: [expectedClientId, "another-client-id"],
        azp: expectedClientId,
      }),
    );
    const missingAzp = await validate(
      await createToken({ aud: [expectedClientId, "another-client-id"] }),
    );
    const wrongAzp = await validate(
      await createToken({
        aud: [expectedClientId, "another-client-id"],
        azp: "another-client-id",
      }),
    );

    expect(valid.valid).toBe(true);
    expect(missingAzp).toEqual({
      valid: false,
      reason: "invalid-audience-authorization",
    });
    expect(wrongAzp).toEqual({
      valid: false,
      reason: "invalid-audience-authorization",
    });
  });

  it("rejects a nonce mismatch", async () => {
    const result = await validate(await createToken({ nonce: "wrong-nonce" }));

    expect(result).toEqual({ valid: false, reason: "invalid-nonce" });
  });

  it.each([
    { name: "missing subject", claims: { sub: undefined } },
    { name: "empty subject", claims: { sub: "" } },
    { name: "missing nonce", claims: { nonce: undefined } },
    { name: "missing issued-at", claims: { iat: undefined } },
    { name: "malformed issued-at", claims: { iat: "1700000000" } },
    { name: "missing expiration", claims: { exp: undefined } },
    { name: "malformed expiration", claims: { exp: "1700000300" } },
    { name: "missing auth-time", claims: { auth_time: undefined } },
    { name: "malformed auth-time", claims: { auth_time: "1700000000" } },
  ])("rejects $name", async ({ claims }) => {
    const result = await validate(await createToken(claims));

    expect(result.valid).toBe(false);
  });

  it("rejects an expired token", async () => {
    const result = await validate(await createToken({ exp: nowSeconds - 1 }));

    expect(result).toEqual({
      valid: false,
      reason: "signature-or-claims-invalid",
    });
  });

  it("rejects stale and future authentication times", async () => {
    const stale = await validate(
      await createToken({ auth_time: nowSeconds - 301 }),
    );
    const future = await validate(
      await createToken({ auth_time: nowSeconds + 1 }),
    );

    expect(stale).toEqual({
      valid: false,
      reason: "invalid-authentication-time",
    });
    expect(future).toEqual({
      valid: false,
      reason: "invalid-authentication-time",
    });
  });

  it("rejects a future issued-at timestamp", async () => {
    const result = await validate(await createToken({ iat: nowSeconds + 1 }));

    expect(result).toEqual({
      valid: false,
      reason: "invalid-issued-at",
    });
  });

  it("does not use email claims as identity proof", async () => {
    const result = await validate(
      await createToken({ email: "different@example.com", email_verified: false }),
    );

    expect(result.valid).toBe(true);
  });

  it("fails closed when the key is unavailable or the input is malformed", async () => {
    const unavailable = await validate(await createToken(), async () => null);
    const malformed = await validate("not-a-jwt");

    expect(unavailable).toEqual({ valid: false, reason: "key-unavailable" });
    expect(malformed).toEqual({ valid: false, reason: "invalid-input" });
  });

  it("never returns the raw token in a failure result", async () => {
    const token = await createToken({ nonce: "wrong-nonce" });
    const result = await validate(token);

    expect(JSON.stringify(result)).not.toContain(token);
  });
});
