import { describe, expect, it } from "vitest";
import {
  matchContactByName,
  normalizeContactName,
  type MatchableContact,
} from "./contact-matching";

function contact(id: string, name: string): MatchableContact {
  return {
    id,
    name,
    phone_number: "+12125550199",
    user_id: "07a40da0-5789-4da0-8c67-29f797f28935",
  };
}

describe("contact name matching", () => {
  it("normalizes Unicode, case, whitespace, and harmless punctuation", () => {
    expect(normalizeContactName("  O’Brien   Jr. ")).toBe("obrien jr");
    expect(normalizeContactName("ÉLODIE")).toBe("élodie");
  });

  it("prefers exact and case-insensitive matches", () => {
    const contacts = [
      contact("1", "Ada Lovelace"),
      contact("2", "Grace Hopper"),
    ];

    expect(matchContactByName("Ada Lovelace", contacts)).toMatchObject({
      status: "matched",
      method: "exact",
      contact: { id: "1" },
    });
    expect(matchContactByName("grace hopper", contacts)).toMatchObject({
      status: "matched",
      method: "case-insensitive",
      contact: { id: "2" },
    });
  });

  it("accepts one conservative fuzzy match", () => {
    const result = matchContactByName("Katherin Johnson", [
      contact("1", "Katherine Johnson"),
      contact("2", "Dorothy Vaughan"),
    ]);

    expect(result).toMatchObject({
      status: "matched",
      method: "fuzzy",
      contact: { id: "1" },
    });
  });

  it("rejects ambiguous and low-confidence fuzzy matches", () => {
    expect(
      matchContactByName("Alexande", [
        contact("1", "Alexander"),
        contact("2", "Alexandre"),
      ]),
    ).toEqual({ status: "ambiguous" });

    expect(
      matchContactByName("completely different", [
        contact("1", "Ada Lovelace"),
      ]),
    ).toEqual({ status: "none" });
  });
});
