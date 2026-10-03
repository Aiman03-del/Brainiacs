import { isValidOpaqueToken } from "@/lib/account-reauth/security-tokens";

export const MAX_INTENT_LIFETIME_MS = 10 * 60 * 1000;

export interface CreateReauthIntentInput {
  userId: string;
  sessionId: string;
  browserTokenHash: string;
  stateHash: string;
  nonceHash: string;
  ttlMs: number;
}

export interface ReauthIntentConsumeInput {
  userId: string;
  sessionId: string;
  browserTokenHash: string;
  stateHash: string;
  nonceHash: string;
}

export interface StoredReauthIntent {
  id: string;
  userId: string;
  sessionId: string;
  browserTokenHash: string;
  stateHash: string;
  nonceHash: string;
  createdAtMs: number;
  expiresAtMs: number;
  consumedAtMs: number | null;
}

export interface ConsumedReauthIntent {
  id: string;
  userId: string;
  sessionId: string;
}

export type ReauthIntentConsumePersistenceResult =
  | { intent: ConsumedReauthIntent }
  | {
      reason: "not-found" | "expired" | "already-consumed" | "mismatch";
    };

export interface ReauthIntentPersistence {
  insert(intent: StoredReauthIntent): Promise<boolean>;
  /**
   * Must atomically validate every binding, expiry, and unconsumed status,
   * then set consumed status and return success in the same database
   * operation or transaction. Never implement this as read-then-write.
   * PostgreSQL adapters must enforce a unique constraint on state_hash.
   */
  consumeIfEligible(
    input: ReauthIntentConsumeInput,
    nowMs: number,
  ): Promise<ReauthIntentConsumePersistenceResult>;
}

export interface ReauthIntentStoreOptions {
  persistence: ReauthIntentPersistence;
  clock?: () => number;
  createId?: () => string;
  maxTtlMs: number;
}

export type CreateReauthIntentResult =
  | { created: true; intentId: string }
  | {
      created: false;
      reason: "invalid-input" | "duplicate-state" | "persistence-failed";
    };

export type ConsumeReauthIntentResult =
  | { consumed: true; intent: ConsumedReauthIntent }
  | { consumed: false; reason: "rejected" };

export interface ReauthIntentStore {
  create(input: CreateReauthIntentInput): Promise<CreateReauthIntentResult>;
  consume(input: ReauthIntentConsumeInput): Promise<ConsumeReauthIntentResult>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidHash(value: unknown): value is string {
  return isValidOpaqueToken(value);
}

function isValidTime(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isValidCreateInput(
  input: CreateReauthIntentInput,
  maxTtlMs: number,
): boolean {
  return (
    isNonEmptyString(input.userId) &&
    isNonEmptyString(input.sessionId) &&
    isValidHash(input.browserTokenHash) &&
    isValidHash(input.stateHash) &&
    isValidHash(input.nonceHash) &&
    isValidTime(input.ttlMs) &&
    input.ttlMs > 0 &&
    Number.isSafeInteger(maxTtlMs) &&
    maxTtlMs > 0 &&
    input.ttlMs <= Math.min(maxTtlMs, MAX_INTENT_LIFETIME_MS)
  );
}

function isValidConsumeInput(input: ReauthIntentConsumeInput): boolean {
  return (
    isNonEmptyString(input.userId) &&
    isNonEmptyString(input.sessionId) &&
    isValidHash(input.browserTokenHash) &&
    isValidHash(input.stateHash) &&
    isValidHash(input.nonceHash)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actualKeys = Object.keys(value).sort();
  return (
    actualKeys.length === keys.length &&
    actualKeys.every((key, index) => key === [...keys].sort()[index])
  );
}

function isValidConsumedIntent(value: unknown): value is ConsumedReauthIntent {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["id", "userId", "sessionId"]) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.sessionId)
  );
}

function isValidPersistenceRejection(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["reason"]) &&
    (value.reason === "not-found" ||
      value.reason === "expired" ||
      value.reason === "already-consumed" ||
      value.reason === "mismatch")
  );
}

function rejected(): ConsumeReauthIntentResult {
  return { consumed: false, reason: "rejected" };
}

export function createReauthIntentStore(
  options: ReauthIntentStoreOptions,
): ReauthIntentStore {
  const clock = options.clock ?? Date.now;
  const createId = options.createId ?? (() => crypto.randomUUID());

  return {
    async create(input) {
      if (!isValidCreateInput(input, options.maxTtlMs)) {
        return { created: false, reason: "invalid-input" };
      }

      let intent: StoredReauthIntent;
      try {
        const createdAtMs = clock();
        if (!isValidTime(createdAtMs)) {
          return { created: false, reason: "persistence-failed" };
        }

        const expiresAtMs = createdAtMs + input.ttlMs;
        if (!isValidTime(expiresAtMs) || expiresAtMs <= createdAtMs) {
          return { created: false, reason: "persistence-failed" };
        }

        intent = {
          id: createId(),
          userId: input.userId,
          sessionId: input.sessionId,
          browserTokenHash: input.browserTokenHash,
          stateHash: input.stateHash,
          nonceHash: input.nonceHash,
          createdAtMs,
          expiresAtMs,
          consumedAtMs: null,
        };

        if (!isNonEmptyString(intent.id)) {
          return { created: false, reason: "persistence-failed" };
        }

        const inserted = await options.persistence.insert(intent);
        return inserted
          ? { created: true, intentId: intent.id }
          : { created: false, reason: "duplicate-state" };
      } catch {
        return { created: false, reason: "persistence-failed" };
      }
    },

    async consume(input) {
      if (!isValidConsumeInput(input)) {
        return rejected();
      }

      try {
        const nowMs = clock();
        if (!isValidTime(nowMs)) return rejected();

        const result = await options.persistence.consumeIfEligible(input, nowMs);
        if (!isRecord(result)) return rejected();

        if (
          "intent" in result &&
          hasExactKeys(result, ["intent"]) &&
          isValidConsumedIntent(result.intent)
        ) {
          return { consumed: true, intent: result.intent };
        }

        return isValidPersistenceRejection(result) ? rejected() : rejected();
      } catch {
        return rejected();
      }
    },
  };
}

export interface MockReauthIntentPersistenceOptions {
  failInserts?: boolean;
  failConsumes?: boolean;
}

export function createMockReauthIntentPersistence(
  options: MockReauthIntentPersistenceOptions = {},
): ReauthIntentPersistence {
  const intents = new Map<string, StoredReauthIntent>();
  const stateToId = new Map<string, string>();
  let consumeQueue = Promise.resolve();

  return {
    async insert(intent) {
      if (options.failInserts) throw new Error("mock persistence failure");
      if (stateToId.has(intent.stateHash)) return false;

      intents.set(intent.id, { ...intent });
      stateToId.set(intent.stateHash, intent.id);
      return true;
    },

    async consumeIfEligible(
      input,
      nowMs,
    ): Promise<ReauthIntentConsumePersistenceResult> {
      const previous = consumeQueue;
      let release!: () => void;
      consumeQueue = new Promise<void>((resolve) => {
        release = resolve;
      });

      return previous
        .catch(() => undefined)
        .then(async () => {
          if (options.failConsumes) {
            throw new Error("mock persistence failure");
          }

          const intentId = stateToId.get(input.stateHash);
          if (!intentId) return { reason: "not-found" as const };

          const intent = intents.get(intentId);
          if (!intent) return { reason: "not-found" as const };
          if (intent.consumedAtMs !== null) {
            return { reason: "already-consumed" as const };
          }
          if (intent.expiresAtMs <= nowMs) {
            return { reason: "expired" as const };
          }
          if (
            intent.userId !== input.userId ||
            intent.sessionId !== input.sessionId ||
            intent.browserTokenHash !== input.browserTokenHash ||
            intent.stateHash !== input.stateHash ||
            intent.nonceHash !== input.nonceHash
          ) {
            return { reason: "mismatch" as const };
          }

          intent.consumedAtMs = nowMs;
          return {
            intent: {
              id: intent.id,
              userId: intent.userId,
              sessionId: intent.sessionId,
            },
          };
        })
        .finally(() => {
          release();
        });
    },
  };
}
