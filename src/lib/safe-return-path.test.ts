import { describe, expect, it } from "vitest";
import { readReturnToCookie, resolveSafeReturnPath } from "./safe-return-path";

describe("resolveSafeReturnPath", () => {
  it("accepts safe application-relative paths", () => {
    expect(
      resolveSafeReturnPath("/calls/97d0a5cd-8742-4059-a821-e57568050bb7"),
    ).toBe("/calls/97d0a5cd-8742-4059-a821-e57568050bb7");
    expect(resolveSafeReturnPath("/contacts")).toBe("/contacts");
  });

  it.each([
    "",
    "   ",
    "https://evil.com",
    "//evil.com",
    "javascript:alert(1)",
    "/\\evil.com",
    "/calls/id with space",
    "calls/no-leading-slash",
  ])("rejects unsafe return path %j", (value) => {
    expect(resolveSafeReturnPath(value)).toBeNull();
  });
});

describe("readReturnToCookie", () => {
  it("reads and decodes the return-to cookie", () => {
    expect(
      readReturnToCookie("bp_return_to=%2Fcalls%2Fcall-1; other=1"),
    ).toBe("/calls/call-1");
  });

  it("returns null when the cookie is missing", () => {
    expect(readReturnToCookie("other=1")).toBeNull();
  });
});
