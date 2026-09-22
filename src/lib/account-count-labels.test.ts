import { describe, expect, it } from "vitest";

import {
  callCountDescription,
  contactCountDescription,
  formatCountNoun,
} from "./account-count-labels";

describe("account count labels", () => {
  it("pluralizes count nouns", () => {
    expect(formatCountNoun(1, "contact", "contacts")).toBe("1 contact");
    expect(formatCountNoun(2, "call", "calls")).toBe("2 calls");
  });

  it("describes contact counts for the account page", () => {
    expect(contactCountDescription(0)).toMatch(/Add someone/);
    expect(contactCountDescription(3)).toBe(
      "3 people you can reach through Bat Phone.",
    );
  });

  it("describes call counts for the account page", () => {
    expect(callCountDescription(0)).toMatch(/will appear here/);
    expect(callCountDescription(2)).toBe("2 calls in your history.");
  });
});
