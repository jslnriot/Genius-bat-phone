import { describe, expect, it } from "vitest";

import { getAccountDisplayName, getAccountInitials } from "./account-initials";

describe("getAccountInitials", () => {
  it("uses the first and last name when a display name is available", () => {
    expect(
      getAccountInitials({
        email: "james@example.com",
        user_metadata: { full_name: "James Buczkowski" },
      }),
    ).toBe("JB");
  });

  it("uses a single letter when only one name part is available", () => {
    expect(
      getAccountInitials({
        email: "ada@example.com",
        user_metadata: { name: "Ada" },
      }),
    ).toBe("A");
  });

  it("derives two letters from a punctuated email local part", () => {
    expect(
      getAccountInitials({ email: "james.buczkowski@example.com" }),
    ).toBe("JB");
  });

  it("uses both letters of a two-letter email local part", () => {
    expect(getAccountInitials({ email: "jb@example.com" })).toBe("JB");
  });

  it("falls back to the first email letter when initials cannot be derived cleanly", () => {
    expect(getAccountInitials({ email: "ada@example.com" })).toBe("A");
  });
});

describe("getAccountDisplayName", () => {
  it("returns a clean Google display name when available", () => {
    expect(
      getAccountDisplayName({
        email: "james@example.com",
        user_metadata: { full_name: "James Buczkowski" },
      }),
    ).toBe("James Buczkowski");
  });

  it("does not invent a name from the email", () => {
    expect(getAccountDisplayName({ email: "ada@example.com" })).toBeNull();
  });
});
