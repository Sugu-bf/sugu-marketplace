/**
 * Build environment validation (audit P1-13): a production build refuses to
 * inline a missing or malformed public variable.
 */
import { describe, it, expect } from "vitest";
import { assertBuildEnv } from "@/lib/env/build-env";

const COMPLETE = {
  NEXT_PUBLIC_API_BASE_URL: "https://api.mysugu.com",
  NEXT_PUBLIC_APP_URL: "https://sugu.pro",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: "123-abc.apps.googleusercontent.com",
  NEXT_PUBLIC_REVERB_APP_KEY: "public-key",
  NEXT_PUBLIC_REVERB_HOST: "ws.mysugu.com",
  NEXT_PUBLIC_REVERB_PORT: "443",
  NEXT_PUBLIC_REVERB_SCHEME: "https",
};

describe("assertBuildEnv", () => {
  it("accepts a complete environment, the optional variables included", () => {
    expect(() => assertBuildEnv(COMPLETE)).not.toThrow();
    expect(() =>
      assertBuildEnv({
        ...COMPLETE,
        NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
        NEXT_PUBLIC_WHATSAPP_CHANNEL_URL: "https://whatsapp.com/channel/abc",
        COMING_SOON_ENABLED: "false",
        CSP_ENFORCE: "true",
      }),
    ).not.toThrow();
  });

  it("lists every missing variable, an empty Docker ARG counting as missing", () => {
    const error = (() => {
      try {
        assertBuildEnv({ ...COMPLETE, NEXT_PUBLIC_APP_URL: "", NEXT_PUBLIC_REVERB_APP_KEY: undefined });
      } catch (e) {
        return (e as Error).message;
      }
      return "";
    })();

    expect(error).toContain("NEXT_PUBLIC_APP_URL: is required");
    expect(error).toContain("NEXT_PUBLIC_REVERB_APP_KEY: is required");
  });

  it.each([
    ["NEXT_PUBLIC_API_BASE_URL", "http://api.mysugu.com"],
    ["NEXT_PUBLIC_APP_URL", "sugu.pro"],
    ["NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB", "not-a-client-id"],
    ["NEXT_PUBLIC_REVERB_HOST", "wss://ws.mysugu.com"],
    ["NEXT_PUBLIC_REVERB_PORT", "https"],
    ["NEXT_PUBLIC_REVERB_SCHEME", "wss"],
    ["NEXT_PUBLIC_META_PIXEL_ID", "pixel"],
    ["COMING_SOON_ENABLED", "yes"],
  ])("refuses %s=%j", (name, value) => {
    expect(() => assertBuildEnv({ ...COMPLETE, [name]: value })).toThrow(name);
  });
});
