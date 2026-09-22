import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadyToCall } from "./ready-to-call";

describe("ReadyToCall", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains how to call Bat Phone from the registered number", () => {
    render(<ReadyToCall batPhoneNumber="+12892782417" />);

    expect(
      screen.getByRole("heading", { name: "Ready to make a call?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Call Bat Phone from your registered phone:"),
    ).toBeInTheDocument();
    expect(screen.getByText("(289) 278-2417")).toBeInTheDocument();
    expect(
      screen.getByText("When prompted, say the name of one of your contacts."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Make sure you’re calling from the number registered in Account.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy number" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Call Bat Phone" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("copies the Bat Phone number and announces success", async () => {
    const user = userEvent.setup();
    render(<ReadyToCall batPhoneNumber="+12892782417" />);

    await user.click(screen.getByRole("button", { name: "Copy number" }));

    expect(await navigator.clipboard.readText()).toBe("+12892782417");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("shows a quiet error when the number cannot be copied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(<ReadyToCall batPhoneNumber="+12892782417" />);

    await user.click(screen.getByRole("button", { name: "Copy number" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "The number could not be copied. Please copy it from the screen.",
    );
  });
});
