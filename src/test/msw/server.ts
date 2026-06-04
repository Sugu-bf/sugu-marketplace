import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Shared MSW Node server for the test suite.
 *
 * Lifecycle (listen / resetHandlers / close) is wired globally in
 * `vitest.setup.ts`. Tests add per-case handlers with `server.use(...)`.
 */
export const server = setupServer(...handlers);
