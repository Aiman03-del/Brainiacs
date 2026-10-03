import {
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
  type KeyInput,
  type JWTHeaderParameters,
  type ProtectedHeaderParameters,
} from "jose";

import {
  isValidOpaqueToken,
  validateExpirationTimestamp,
  validateFreshTimestamp,
} from "@/lib/account-reauth/security-tokens";

export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_ISSUER = "https://accounts.google.com";

const GOOGLE_SIGNING_ALGORITHM = "RS256";
const KID_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

export type GoogleVerificationKey = KeyInput;

export interface GoogleJwksResolver {
  (header: Readonly<Pick<JWTHeaderParameters, "alg" | "kid">>): Promise<
    GoogleVerificationKey | null
  >;
}

export interface GoogleIdTokenValidationOptions {
  token: unknown;
  resolveKey: GoogleJwksResolver;
  expectedClientId: unknown;
  expectedNonce: unknown;
  freshnessWindowMs: number;
  clock?: () => number;
  clockToleranceMs?: number;
}

export interface ValidatedGoogleIdToken {
  subject: string;
  issuedAt: number;
  expiresAt: number;
  authenticatedAt: number;
}

export type GoogleIdTokenValidationResult =
  | { valid: true; claims: ValidatedGoogleIdToken }
  | {
      valid: false;
      reason:
        | "invalid-input"
        | "unsupported-algorithm"
        | "invalid-key-id"
        | "key-unavailable"
        | "signature-or-claims-invalid"
        | "invalid-audience-authorization"
        | "invalid-nonce"
        | "invalid-subject"
        | "invalid-issued-at"
        | "invalid-expiration"
        | "invalid-authentication-time";
    };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidUnixSeconds(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function hasValidAudienceAuthorization(
  payload: JWTPayload,
  expectedClientId: string,
): boolean {
  const audience = payload.aud;
  const authorizedParty = payload.azp;

  if (typeof audience === "string") {
    return (
      audience === expectedClientId &&
      (authorizedParty === undefined || authorizedParty === expectedClientId)
    );
  }

  if (!Array.isArray(audience) || audience.length < 2) return false;
  if (
    audience.some((entry) => typeof entry !== "string") ||
    !audience.includes(expectedClientId)
  ) {
    return false;
  }

  return authorizedParty === expectedClientId;
}

function isValidIssuedAt(
  value: unknown,
  nowMs: number,
  clockToleranceMs: number,
): value is number {
  return (
    isValidUnixSeconds(value) &&
    value * 1000 <= nowMs + clockToleranceMs
  );
}

export async function validateGoogleIdToken(
  options: GoogleIdTokenValidationOptions,
): Promise<GoogleIdTokenValidationResult> {
  const {
    token,
    resolveKey,
    expectedClientId,
    expectedNonce,
    freshnessWindowMs,
    clock = Date.now,
    clockToleranceMs = 0,
  } = options;

  if (
    typeof token !== "string" ||
    !isNonEmptyString(expectedClientId) ||
    !isValidOpaqueToken(expectedNonce) ||
    !Number.isFinite(freshnessWindowMs) ||
    freshnessWindowMs < 0 ||
    !Number.isFinite(clockToleranceMs) ||
    clockToleranceMs < 0
  ) {
    return { valid: false, reason: "invalid-input" };
  }

  const nowMs = clock();
  if (!Number.isFinite(nowMs)) {
    return { valid: false, reason: "invalid-input" };
  }

  let protectedHeader: ProtectedHeaderParameters;
  try {
    protectedHeader = decodeProtectedHeader(token);
  } catch {
    return { valid: false, reason: "invalid-input" };
  }

  if (protectedHeader.alg !== GOOGLE_SIGNING_ALGORITHM) {
    return { valid: false, reason: "unsupported-algorithm" };
  }

  if (
    typeof protectedHeader.kid !== "string" ||
    !KID_PATTERN.test(protectedHeader.kid)
  ) {
    return { valid: false, reason: "invalid-key-id" };
  }

  let verificationKey: GoogleVerificationKey | null;
  try {
    verificationKey = await resolveKey({
      alg: protectedHeader.alg,
      kid: protectedHeader.kid,
    });
  } catch {
    return { valid: false, reason: "key-unavailable" };
  }

  if (!verificationKey) return { valid: false, reason: "key-unavailable" };

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, verificationKey, {
      algorithms: [GOOGLE_SIGNING_ALGORITHM],
      audience: expectedClientId,
      issuer: GOOGLE_ISSUER,
      clockTolerance: clockToleranceMs / 1000,
      currentDate: new Date(nowMs),
    }));
  } catch {
    return { valid: false, reason: "signature-or-claims-invalid" };
  }

  if (!hasValidAudienceAuthorization(payload, expectedClientId)) {
    return { valid: false, reason: "invalid-audience-authorization" };
  }

  if (payload.nonce !== expectedNonce) {
    return { valid: false, reason: "invalid-nonce" };
  }

  if (!isNonEmptyString(payload.sub)) {
    return { valid: false, reason: "invalid-subject" };
  }

  if (!isValidIssuedAt(payload.iat, nowMs, clockToleranceMs)) {
    return { valid: false, reason: "invalid-issued-at" };
  }

  if (
    !isValidUnixSeconds(payload.exp) ||
    !validateExpirationTimestamp(payload.exp, {
      clock: () => nowMs,
      clockSkewMs: clockToleranceMs,
    })
  ) {
    return { valid: false, reason: "invalid-expiration" };
  }

  if (
    !validateFreshTimestamp(payload.auth_time, {
      clock: () => nowMs,
      maxAgeMs: freshnessWindowMs,
      futureSkewMs: clockToleranceMs,
    })
  ) {
    return { valid: false, reason: "invalid-authentication-time" };
  }

  return {
    valid: true,
    claims: {
      subject: payload.sub,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      authenticatedAt: payload.auth_time as number,
    },
  };
}
