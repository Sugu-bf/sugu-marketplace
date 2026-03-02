/**
 * Normalized API Error — single error shape across the entire app.
 *
 * Every API call that fails produces an ApiError with:
 * - status: HTTP status code (0 for network errors)
 * - code: machine-readable error code
 * - message: human-readable message (safe to display)
 * - details: optional validation errors or extra context
 */

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "INVALID_SCHEMA"
  | "PARSE_ERROR"
  | "CSRF_MISMATCH"
  | "UNKNOWN";

export interface ApiErrorDetails {
  /** Laravel-style field validation errors */
  errors?: Record<string, string[]>;
  /** Any additional context (never secrets) */
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details: ApiErrorDetails | undefined;
  public readonly requestId: string | undefined;

  constructor(opts: {
    status: number;
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
    requestId?: string;
    cause?: unknown;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.requestId = opts.requestId;
  }

  /** Whether this is a client error (4xx) */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** Whether this is a server error (5xx) */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** Whether this is a network/timeout error */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Whether this request can be retried */
  get isRetryable(): boolean {
    return (
      this.code === "NETWORK_ERROR" ||
      this.code === "TIMEOUT" ||
      this.status === 429 ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504
    );
  }

  /** User-friendly action hint for UI */
  get userAction(): string {
    switch (this.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT":
        return "Vérifiez votre connexion internet et réessayez.";
      case "UNAUTHORIZED":
        return "Veuillez vous reconnecter.";
      case "FORBIDDEN":
        return "Vous n'avez pas les permissions nécessaires.";
      case "NOT_FOUND":
        return "La ressource demandée est introuvable.";
      case "VALIDATION_ERROR":
        return "Veuillez corriger les erreurs du formulaire.";
      case "RATE_LIMITED":
        return "Trop de requêtes. Veuillez patienter un moment.";
      case "SERVER_ERROR":
        return "Une erreur serveur est survenue. Réessayez plus tard.";
      case "INVALID_SCHEMA":
        return "Les données reçues du serveur sont invalides.";
      case "CSRF_MISMATCH":
        return "Session expirée. Veuillez rafraîchir la page.";
      case "CONFLICT":
        return "Stock insuffisant ou conflit de données. Veuillez rafraîchir la page.";
      default:
        return "Une erreur inattendue est survenue.";
    }
  }

  /** Safe serialization (never includes auth headers or cookies) */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      requestId: this.requestId,
    };
  }
}

/** Map HTTP status codes to ApiErrorCode */
export function httpStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 419:
      return "CSRF_MISMATCH";
    case 422:
      return "VALIDATION_ERROR";
    case 429:
      return "RATE_LIMITED";
    default:
      if (status >= 500) return "SERVER_ERROR";
      return "UNKNOWN";
  }
}

/** Type guard to check if an unknown error is an ApiError */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
