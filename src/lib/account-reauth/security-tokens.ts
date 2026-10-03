import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";

const TOKEN_BYTE_LENGTH = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const textEncoder = new TextEncoder();

type DigestCrypto = Pick<SubtleCrypto, "digest">;

export interface SecurityCrypto {
  getRandomValues(array: Uint8Array): Uint8Array;
  subtle: DigestCrypto;
}

export interface FreshTimestampOptions {
  clock?: () => number;
  maxAgeMs: number;
  futureSkewMs?: number;
}

export interface ExpirationTimestampOptions {
  clock?: () => number;
  clockSkewMs?: number;
}

export type TimingSafeComparator = (
  left: Uint8Array,
  right: Uint8Array,
) => boolean;

function getDefaultCrypto(): SecurityCrypto {
  if (typeof globalThis.crypto === "undefined") {
    throw new Error("Secure cryptography is unavailable.");
  }

  return globalThis.crypto;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isValidDuration(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isValidOpaqueToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function generateOpaqueToken(securityCrypto = getDefaultCrypto()): string {
  const bytes = new Uint8Array(TOKEN_BYTE_LENGTH);
  securityCrypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

export function generateState(securityCrypto = getDefaultCrypto()): string {
  return generateOpaqueToken(securityCrypto);
}

export function generateNonce(securityCrypto = getDefaultCrypto()): string {
  return generateOpaqueToken(securityCrypto);
}

export function generateBrowserBindingToken(
  securityCrypto = getDefaultCrypto(),
): string {
  return generateOpaqueToken(securityCrypto);
}

export async function hashOpaqueToken(
  token: unknown,
  securityCrypto?: SecurityCrypto,
): Promise<string | null> {
  if (!isValidOpaqueToken(token)) return null;

  try {
    const cryptoProvider = securityCrypto ?? getDefaultCrypto();
    const digest = await cryptoProvider.subtle.digest(
      "SHA-256",
      textEncoder.encode(token),
    );
    return encodeBase64Url(new Uint8Array(digest));
  } catch {
    return null;
  }
}

export function constantTimeEqual(
  left: unknown,
  right: unknown,
  comparator: TimingSafeComparator = nodeTimingSafeEqual,
): boolean {
  if (!isValidOpaqueToken(left) || !isValidOpaqueToken(right)) return false;

  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  if (leftBytes.byteLength !== rightBytes.byteLength) return false;

  try {
    return comparator(leftBytes, rightBytes);
  } catch {
    return false;
  }
}

export function validateFreshTimestamp(
  timestamp: unknown,
  options: FreshTimestampOptions,
): boolean {
  const nowMs = options.clock?.() ?? Date.now();
  const futureSkewMs = options.futureSkewMs ?? 0;

  if (
    !isValidTimestamp(timestamp) ||
    !Number.isFinite(nowMs) ||
    !isValidDuration(options.maxAgeMs) ||
    !isValidDuration(futureSkewMs)
  ) {
    return false;
  }

  const timestampMs = timestamp * 1000;
  return (
    timestampMs <= nowMs + futureSkewMs &&
    nowMs - timestampMs <= options.maxAgeMs
  );
}

export function validateExpirationTimestamp(
  timestamp: unknown,
  options: ExpirationTimestampOptions = {},
): boolean {
  const nowMs = options.clock?.() ?? Date.now();
  const clockSkewMs = options.clockSkewMs ?? 0;

  if (
    !isValidTimestamp(timestamp) ||
    !Number.isFinite(nowMs) ||
    !isValidDuration(clockSkewMs)
  ) {
    return false;
  }

  return timestamp * 1000 >= nowMs - clockSkewMs;
}
