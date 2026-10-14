import { describe, expect, it } from "vitest";
import { mapSocialLinks } from "../store.mappers";

describe("mapSocialLinks", () => {
  it("keeps the links the seller chose to show, in a fixed order", () => {
    expect(
      mapSocialLinks({
        facebook: "https://facebook.com/boutiquetech",
        instagram: null,
        x: null,
        linkedin: null,
        website: "https://boutiquetech.bf",
        whatsapp: "https://wa.me/22670123456",
      }),
    ).toEqual([
      { network: "website", url: "https://boutiquetech.bf" },
      { network: "whatsapp", url: "https://wa.me/22670123456" },
      { network: "facebook", url: "https://facebook.com/boutiquetech" },
    ]);
  });

  it("never turns something else than an http(s) address into a link", () => {
    expect(
      mapSocialLinks({ facebook: "javascript:alert(1)", instagram: "instagram.com/x", x: null, linkedin: null }),
    ).toEqual([]);
  });

  it("answers nothing when the API sends no links (older API)", () => {
    expect(mapSocialLinks(undefined)).toEqual([]);
  });
});
