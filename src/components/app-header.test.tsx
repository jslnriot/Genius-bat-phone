import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the Bat Phone wordmark with a phone icon", () => {
    render(<AppHeader />);

    expect(screen.getByLabelText("Bat Phone")).toBeInTheDocument();
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
  });
});
