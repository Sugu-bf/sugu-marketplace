/**
 * The variables a production build inlines into the bundle (audit P1-13).
 *
 * NEXT_PUBLIC_* values are fixed at build time: one missing from the Docker
 * build used to ship silently (no Google button, fbq('init',''), a WhatsApp
 * link to "#"). next.config validates them when it runs a production build,
 * and the build fails with the list of what is wrong.
 *
 * Every variable here must also be declared as ARG/ENV in the Dockerfile.
 */
import { z } from "zod";

const httpsUrl = z.url({ protocol: /^https$/, error: "must be an https:// URL" });

const hostname = z
  .string()
  .regex(/^[a-z0-9.-]+$/i, "must be a bare host name (no scheme, port or path)");

const flag = z.enum(["true", "false"]).optional();

export const buildEnvSchema = z.object({
  /** Laravel API origin, e.g. https://api.mysugu.com */
  NEXT_PUBLIC_API_BASE_URL: httpsUrl,
  /** The site's own public origin: canonical URLs, sitemap, Origin checks. */
  NEXT_PUBLIC_APP_URL: httpsUrl,
  /** Google Identity Services web client id (sign in with Google). */
  NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: z
    .string()
    .regex(/\.apps\.googleusercontent\.com$/, "must be a Google OAuth web client id"),
  /** Reverb (realtime chat): the backend's public app key, never its secret. */
  NEXT_PUBLIC_REVERB_APP_KEY: z.string().min(1, "is required"),
  /** Reverb socket host for this environment (production: ws.mysugu.com). */
  NEXT_PUBLIC_REVERB_HOST: hostname,
  NEXT_PUBLIC_REVERB_PORT: z.string().regex(/^\d{2,5}$/, "must be a port number"),
  NEXT_PUBLIC_REVERB_SCHEME: z.enum(["http", "https"]),
  /** Meta Pixel id; without it no pixel is loaded at all. */
  NEXT_PUBLIC_META_PIXEL_ID: z.string().regex(/^\d{5,20}$/, "must be a numeric pixel id").optional(),
  /** WhatsApp channel of the pre-launch page; without it the link is hidden. */
  NEXT_PUBLIC_WHATSAPP_CHANNEL_URL: httpsUrl.optional(),
  COMING_SOON_ENABLED: flag,
  CSP_ENFORCE: flag,
});

export type BuildEnv = z.infer<typeof buildEnvSchema>;

/** Empty strings count as unset: a Docker ARG without value is "". */
function withoutEmpty(env: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => Boolean(entry[1]?.trim())),
  );
}

/** Throws with every problem listed when the build environment is incomplete. */
export function assertBuildEnv(env: Record<string, string | undefined>): BuildEnv {
  const result = buildEnvSchema.safeParse(withoutEmpty(env));
  if (result.success) return result.data;

  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.code === "invalid_type" ? "is required" : issue.message}`,
  );
  throw new Error(`Invalid build environment:\n${problems.join("\n")}`);
}
