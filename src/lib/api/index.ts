/**
 * API Layer — public barrel export.
 *
 * Import everything from "@/lib/api":
 * @example
 * import { api, buildApiUrl, ApiError, CacheTags } from "@/lib/api";
 */

// Core client
export { api } from "./client";
export type { ApiRequestOptions, ApiResponse, PaginatedResponse } from "./client";

// Configuration
export { API_BASE_URL, API_TIMEOUT_MS } from "./config";

// Errors
export { ApiError, isApiError, httpStatusToErrorCode } from "./errors";
export type { ApiErrorCode, ApiErrorDetails } from "./errors";

// URL builders
export { buildApiUrl, buildQueryString, publicUrl, meUrl, v1Url, paginationParams } from "./endpoints";
export type { QueryParams, PaginationParams } from "./endpoints";

// Cache
export { CacheTags, invalidateTag, invalidateTags, RevalidatePresets } from "./cache";

// Auth
export { initCsrf, getAuthUser, requireAuth, isAuthenticated, logout } from "./auth";
export type { AuthUser } from "./auth";

// Schemas
export {
  PaginationMetaSchema,
  PaginationLinksSchema,
  paginatedSchema,
  successSchema,
  MessageResponseSchema,
  MediaSchema,
  ImageSchema,
  PriceSchema,
  SlugSchema,
  UlidSchema,
} from "./schemas";
export type { PaginationMeta, PaginationLinks, MessageResponse, Media, ImageData } from "./schemas";
