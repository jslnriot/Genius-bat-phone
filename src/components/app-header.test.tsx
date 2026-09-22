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
    expect(
      screen.queryByRole("link", { name: /Account for/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a compact identity control that links to Account", () => {
    render(
      <AppHeader
        homeHref="/contacts"
        account={{ email: "james@example.com", initials: "JB" }}
      />,
    );

    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(screen.getByRole("banner", { name: "Bat Phone" }).querySelector("svg")).not.toBeNull();
    const accountLink = screen.getByRole("link", {
      name: "Account for james@example.com",
    });
    expect(accountLink).toHaveAttribute("href", "/account");
    expect(accountLink).toHaveTextContent("JB");
    expect(screen.queryByText("james@example.com")).not.toBeInTheDocument();
  });
});
