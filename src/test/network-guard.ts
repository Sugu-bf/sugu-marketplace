/**
 * No test may reach a real Sugu host (audit M7): a test without a mock for an
 * API call would otherwise read — or write — production data.
 *
 * Wraps the global fetch once, before any test file runs. A test that stubs
 * fetch (vi.stubGlobal) or opts into MSW replaces or intercepts this wrapper,
 * so mocked calls never reach it; whatever does reach it for a guarded host
 * fails loudly instead of going out.
 */

const GUARDED_HOSTS = /(^|\.)(mysugu\.com|sugu\.pro)$/i;

export function isGuardedUrl(input: RequestInfo | URL): boolean {
  try {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return GUARDED_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

export function installNetworkGuard(): void {
  const realFetch = globalThis.fetch;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (isGuardedUrl(input)) {
      const url = input instanceof Request ? input.url : String(input);
      return Promise.reject(
        new Error(`[network-guard] Real request to ${url} blocked in tests: mock it (MSW or vi.stubGlobal).`),
      );
    }
    return realFetch(input, init);
  };
}
