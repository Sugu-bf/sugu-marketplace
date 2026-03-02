/**
 * Idempotency Key Utilities — generates unique keys for checkout mutations.
 *
 * RULES:
 * - Every "place order" or "create session" call MUST have a unique idempotency key
 * - Keys are per-action, per-session, per-user-intent
 * - Never reuse keys across different actions
 * - Frontend uses these as `X-Idempotency-Key` header
 */

/**
 * Generate a globally unique idempotency key.
 * Format: `{prefix}_{timestamp}_{random}`
 */
export function generateIdempotencyKey(prefix: string = "idem"): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Generate an idempotency key for creating a checkout session.
 */
export function sessionIdempotencyKey(): string {
  return generateIdempotencyKey("cs");
}

/**
 * Generate an idempotency key for placing an order.
 * Includes the session ID to tie the key to the specific checkout.
 */
export function orderIdempotencyKey(sessionId: string): string {
  return generateIdempotencyKey(`po_${sessionId.slice(0, 8)}`);
}

// ─── Mutex for anti-double-submit ────────────────────────────

const activeMutexes = new Set<string>();

/**
 * Acquire a mutex lock for a given action key.
 * Returns true if acquired, false if already locked (double submit).
 */
export function acquireMutex(key: string): boolean {
  if (activeMutexes.has(key)) return false;
  activeMutexes.add(key);
  return true;
}

/**
 * Release a mutex lock.
 */
export function releaseMutex(key: string): void {
  activeMutexes.delete(key);
}

/**
 * Execute an async action with mutex protection.
 * Prevents double-submit for the same action key.
 * Throws if the mutex is already held.
 */
export async function withMutex<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!acquireMutex(key)) {
    throw new Error(`Action "${key}" is already in progress.`);
  }
  try {
    return await fn();
  } finally {
    releaseMutex(key);
  }
}
