import { describe, expect, it, vi } from "vitest";

import {
  createMockReauthIntentPersistence,
  createReauthIntentStore,
  type CreateReauthIntentInput,
  type ReauthIntentPersistence,
} from "@/lib/account-reauth/intent-store";

const createdAtMs = 1_700_000_000_000;
const userId = "user-123";
const sessionId = "session-123";
const browserTokenHash = "a".repeat(43);
const stateHash = "b".repeat(43);
const nonceHash = "c".repeat(43);
const replacementStateHash = "d".repeat(43);

function createInput(
  overrides: Partial<CreateReauthIntentInput> = {},
): CreateReauthIntentInput {
  return {
    userId,
    sessionId,
    browserTokenHash,
    stateHash,
    nonceHash,
    ttlMs: 5 * 60 * 1000,
    ...overrides,
  };
}

function createStore(
  persistence = createMockReauthIntentPersistence(),
  clock: () => number = () => createdAtMs,
  maxTtlMs = 10 * 60 * 1000,
) {
  return createReauthIntentStore({
    persistence,
    clock,
    createId: () => "intent-123",
    maxTtlMs,
  });
}

async function createIntent(
  store = createStore(),
  input: CreateReauthIntentInput = createInput(),
) {
  const result = await store.create(input);
  expect(result).toEqual({ created: true, intentId: "intent-123" });
  return store;
}

describe("reauthentication intent store", () => {
  it("creates an intent with hashes and no raw token fields", async () => {
    const inserted: unknown[] = [];
    const persistence: ReauthIntentPersistence = {
      insert: vi.fn(async (intent) => {
        inserted.push(intent);
        return true;
      }),
      consumeIfEligible: vi.fn(async () => ({ reason: "not-found" as const })),
    };
    const store = createStore(persistence);

    await expect(store.create(createInput())).resolves.toEqual({
      created: true,
      intentId: "intent-123",
    });

    const serialized = JSON.stringify(inserted);
    expect(Object.keys(inserted[0] as object).sort()).toEqual([
      "browserTokenHash",
      "consumedAtMs",
      "createdAtMs",
      "expiresAtMs",
      "id",
      "nonceHash",
      "sessionId",
      "stateHash",
      "userId",
    ]);
    expect(serialized).not.toContain("raw-state");
    expect(serialized).not.toContain("raw-nonce");
    expect(serialized).not.toContain("raw-browser-token");
    expect(serialized).not.toContain("authorization-code");
    expect(serialized).not.toContain("id-token");
    expect(serialized).toContain(browserTokenHash);
    expect(serialized).toContain(stateHash);
    expect(serialized).toContain(nonceHash);
  });

  it("rejects duplicate state hashes", async () => {
    const store = createStore();

    await createIntent(store);
    await expect(store.create(createInput())).resolves.toEqual({
      created: false,
      reason: "duplicate-state",
    });
  });

  it.each([
    { name: "empty user", input: { userId: "" } },
    { name: "empty session", input: { sessionId: "" } },
    { name: "raw browser token", input: { browserTokenHash: "raw-browser-token" } },
    { name: "raw state", input: { stateHash: "raw-state" } },
    { name: "raw nonce", input: { nonceHash: "raw-nonce" } },
    { name: "zero TTL", input: { ttlMs: 0 } },
    { name: "negative TTL", input: { ttlMs: -1 } },
    { name: "non-finite TTL", input: { ttlMs: Number.POSITIVE_INFINITY } },
    { name: "unsafe TTL", input: { ttlMs: Number.MAX_SAFE_INTEGER + 1 } },
  ])("rejects invalid create input: $name", async ({ input }) => {
    const persistence = createMockReauthIntentPersistence();
    const store = createStore(persistence);

    await expect(store.create(createInput(input))).resolves.toEqual({
      created: false,
      reason: "invalid-input",
    });
  });

  it("enforces the fixed maximum lifetime regardless of caller configuration", async () => {
    const store = createStore(
      createMockReauthIntentPersistence(),
      () => createdAtMs,
      60 * 60 * 1000,
    );

    await expect(
      store.create(createInput({ ttlMs: 10 * 60 * 1000 + 1 })),
    ).resolves.toEqual({ created: false, reason: "invalid-input" });
  });

  it("rejects clock exceptions with defined fail-closed results", async () => {
    const throwingClock = () => {
      throw new Error("clock unavailable");
    };
    const store = createStore(createMockReauthIntentPersistence(), throwingClock);

    await expect(store.create(createInput())).resolves.toEqual({
      created: false,
      reason: "persistence-failed",
    });
    await expect(
      store.consume({ userId, sessionId, browserTokenHash, stateHash, nonceHash }),
    ).resolves.toEqual({ consumed: false, reason: "rejected" });
  });

  it("rejects persistence errors during create and consume", async () => {
    const failingCreate = createStore(
      createMockReauthIntentPersistence({ failInserts: true }),
    );
    const failingConsume = createStore(
      createMockReauthIntentPersistence({ failConsumes: true }),
    );

    await expect(failingCreate.create(createInput())).resolves.toEqual({
      created: false,
      reason: "persistence-failed",
    });
    await expect(
      failingConsume.consume({
        userId,
        sessionId,
        browserTokenHash,
        stateHash,
        nonceHash,
      }),
    ).resolves.toEqual({ consumed: false, reason: "rejected" });
  });

  it.each([
    {},
    { intent: null },
    { reason: "unknown" },
    { reason: "not-found", extra: true },
  ])("rejects malformed persistence results: %j", async (adapterResult) => {
    const persistence: ReauthIntentPersistence = {
      insert: vi.fn(async () => true),
      consumeIfEligible: vi.fn(async () => adapterResult as never),
    };
    const store = createStore(persistence);

    await expect(
      store.consume({ userId, sessionId, browserTokenHash, stateHash, nonceHash }),
    ).resolves.toEqual({ consumed: false, reason: "rejected" });
  });

  it("rejects a missing intent", async () => {
    const store = createStore();

    await expect(
      store.consume({ userId, sessionId, browserTokenHash, stateHash, nonceHash }),
    ).resolves.toEqual({ consumed: false, reason: "rejected" });
  });

  it("rejects an expired intent", async () => {
    let nowMs = createdAtMs;
    const store = createStore(createMockReauthIntentPersistence(), () => nowMs);

    await createIntent(store, createInput({ ttlMs: 1000 }));
    nowMs += 1000;

    await expect(
      store.consume({ userId, sessionId, browserTokenHash, stateHash, nonceHash }),
    ).resolves.toEqual({ consumed: false, reason: "rejected" });
  });

  it("rejects mismatched user, session, browser, state, or nonce", async () => {
    const cases = [
      { name: "user", input: { userId: "other-user" } },
      { name: "session", input: { sessionId: "other-session" } },
      { name: "browser", input: { browserTokenHash: "e".repeat(43) } },
      { name: "state", input: { stateHash: replacementStateHash } },
      { name: "nonce", input: { nonceHash: "f".repeat(43) } },
    ] as const;

    for (const testCase of cases) {
      const store = await createIntent();
      await expect(
        store.consume({
          userId,
          sessionId,
          browserTokenHash,
          stateHash,
          nonceHash,
          ...testCase.input,
        }),
      ).resolves.toEqual({ consumed: false, reason: "rejected" });
    }
  });

  it("consumes an eligible intent exactly once", async () => {
    const store = await createIntent();
    const input = { userId, sessionId, browserTokenHash, stateHash, nonceHash };

    await expect(store.consume(input)).resolves.toEqual({
      consumed: true,
      intent: { id: "intent-123", userId, sessionId },
    });
    await expect(store.consume(input)).resolves.toEqual({
      consumed: false,
      reason: "rejected",
    });
  });

  it("allows exactly one success for concurrent consumption attempts", async () => {
    const store = await createIntent();
    const input = { userId, sessionId, browserTokenHash, stateHash, nonceHash };

    const results = await Promise.all([
      store.consume(input),
      store.consume(input),
      store.consume(input),
    ]);

    expect(results.filter((result) => result.consumed)).toHaveLength(1);
    expect(results.filter((result) => !result.consumed)).toHaveLength(2);
    expect(
      results.filter(
        (result) => !result.consumed && result.reason === "rejected",
      ),
    ).toHaveLength(2);
  });

  it("recovers after a failed consume operation", async () => {
    const persistenceOptions = { failConsumes: true };
    const persistence = createMockReauthIntentPersistence(persistenceOptions);
    const store = await createIntent(createStore(persistence));
    const input = { userId, sessionId, browserTokenHash, stateHash, nonceHash };

    await expect(store.consume(input)).resolves.toEqual({
      consumed: false,
      reason: "rejected",
    });

    persistenceOptions.failConsumes = false;
    await expect(store.consume(input)).resolves.toEqual({
      consumed: true,
      intent: { id: "intent-123", userId, sessionId },
    });
  });

  it("has no account-deletion method or dependency", async () => {
    const store = await createIntent();

    expect(Object.keys(store).sort()).toEqual(["consume", "create"]);
  });
});
