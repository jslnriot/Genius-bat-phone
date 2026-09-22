import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the Bat Phone wordmark with a phone icon", () => {
    render(<AppHeader />);

    const header = screen.getByRole("banner", { name: "Bat Phone" });
    expect(header).toBeInTheDocument();
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(header.querySelector("svg")).not.toBeNull();
    expect(
      screen.queryByRole("link", { name: "Bat Phone home" }),
    ).not.toBeInTheDocument();
  });

  it("links configured users home to Contacts", () => {
    render(<AppHeader homeHref="/contacts" />);

    expect(screen.getByRole("link", { name: "Bat Phone home" })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
  });
});
