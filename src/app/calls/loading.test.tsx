import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CallsLoading from "./loading";

describe("CallsLoading", () => {
  it("announces loading in customer-facing language", () => {
    render(<CallsLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading calls…");
  });
});
