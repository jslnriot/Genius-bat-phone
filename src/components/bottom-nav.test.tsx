import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { BottomNav } from "./bottom-nav";

describe("BottomNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("contains exactly Contacts, Calls, and Account", () => {
    usePathname.mockReturnValue("/contacts");

    render(<BottomNav />);

    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Calls",
      "Contacts",
      "Account",
    ]);
    expect(links).toHaveLength(3);
    expect(nav.className).not.toMatch(/\bfixed\b/);
  });

  it("marks the active route with aria-current", () => {
    usePathname.mockReturnValue("/calls/call-1");

    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Calls" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Contacts" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Account" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps inactive destinations usable", () => {
    usePathname.mockReturnValue("/account");

    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByRole("link", { name: "Calls" })).toHaveAttribute(
      "href",
      "/calls",
    );
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
  });
});
