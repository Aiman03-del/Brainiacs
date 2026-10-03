import { webcrypto } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  constantTimeEqual,
  generateBrowserBindingToken,
  generateNonce,
  generateState,
  hashOpaqueToken,
  isValidOpaqueToken,
  validateExpirationTimestamp,
  validateFreshTimestamp,
  type SecurityCrypto,
} from "@/lib/account-reauth/security-tokens";

const nowMs = 1_700_000_000_000;
const currentTimestamp = nowMs / 1000;

function createDeterministicCrypto(): SecurityCrypto {
  let seed = 0;

  return {
    getRandomValues(array) {
      for (let index = 0; index < array.length; index += 1) {
        array[index] = (seed + index) % 256;
      }
      seed += 1;
      return array;
    },
    subtle: webcrypto.subtle,
  };
}

describe("security token helpers", () => {
  it("generates 256-bit base64url tokens for each token purpose", () => {
    const securityCrypto = createDeterministicCrypto();
    const tokens = [
      generateState(securityCrypto),
      generateNonce(securityCrypto),
      generateBrowserBindingToken(securityCrypto),
    ];

    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/u);
      expect(isValidOpaqueToken(token)).toBe(true);
    }
  });

  it("produces different values on different calls", () => {
    const securityCrypto = createDeterministicCrypto();

    expect(generateState(securityCrypto)).not.toBe(generateState(securityCrypto));
  });

  it("hashes the same token deterministically with SHA-256", async () => {
    const token = generateState(createDeterministicCrypto());
    const firstHash = await hashOpaqueToken(token, {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: webcrypto.subtle,
    });
    const secondHash = await hashOpaqueToken(token, {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: webcrypto.subtle,
    });

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[A-Za-z0-9_-]{43}$/u);
  });

  it("uses the injected constant-time comparator for valid tokens", () => {
    let comparisons = 0;
    const comparator = (left: Uint8Array, right: Uint8Array) => {
      comparisons += 1;
      return left.every((byte, index) => byte === right[index]);
    };
    const token = generateState(createDeterministicCrypto());

    expect(constantTimeEqual(token, token, comparator)).toBe(true);
    expect(comparisons).toBe(1);
  });

  it.each(["", "short", "contains spaces", "unicode", null, undefined, 42])(
    "rejects invalid token input: %s",
    (invalidToken) => {
      expect(isValidOpaqueToken(invalidToken)).toBe(false);
      expect(constantTimeEqual(invalidToken, invalidToken)).toBe(false);
    },
  );

  it("fails closed for invalid hash input without exposing it", async () => {
    const invalidToken = "raw-token-that-must-not-appear";

    await expect(hashOpaqueToken(invalidToken)).resolves.toBeNull();
    expect(constantTimeEqual(invalidToken, "another-invalid-token")).toBe(false);
  });

  it("accepts a current fresh timestamp", () => {
    expect(
      validateFreshTimestamp(currentTimestamp, {
        clock: () => nowMs,
        maxAgeMs: 5 * 60 * 1000,
      }),
    ).toBe(true);
  });

  it.each([
    null,
    undefined,
    "",
    "1700000000",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    0,
    -1,
    currentTimestamp + 1,
    currentTimestamp - 301,
  ])("rejects invalid, future, or stale fresh timestamp: %s", (timestamp) => {
    expect(
      validateFreshTimestamp(timestamp, {
        clock: () => nowMs,
        maxAgeMs: 5 * 60 * 1000,
      }),
    ).toBe(false);
  });

  it("rejects an expired timestamp and accepts an unexpired one", () => {
    expect(
      validateExpirationTimestamp(currentTimestamp - 1, {
        clock: () => nowMs,
      }),
    ).toBe(false);
    expect(
      validateExpirationTimestamp(currentTimestamp + 1, {
        clock: () => nowMs,
      }),
    ).toBe(true);
  });

  it("rejects malformed expiration timestamps and invalid clock options", () => {
    expect(
      validateExpirationTimestamp("1700000001", { clock: () => nowMs }),
    ).toBe(false);
    expect(
      validateExpirationTimestamp(currentTimestamp + 1, {
        clock: () => nowMs,
        clockSkewMs: -1,
      }),
    ).toBe(false);
  });
});
