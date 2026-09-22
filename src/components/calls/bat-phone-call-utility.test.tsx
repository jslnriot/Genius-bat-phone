import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BatPhoneCallUtility } from "./bat-phone-call-utility";

describe("BatPhoneCallUtility", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the Bat Phone number and registered-phone guidance", () => {
    render(<BatPhoneCallUtility batPhoneNumber="+12892782417" />);

    expect(screen.getByLabelText("Call Bat Phone")).toBeInTheDocument();
    expect(screen.getByText("Bat Phone")).toBeInTheDocument();
    expect(screen.getByText("(289) 278-2417")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Call this number from your registered phone. When prompted, say a contact's name, or follow the keypad instructions.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("copies the canonical E.164 number and announces success", async () => {
    const user = userEvent.setup();
    render(<BatPhoneCallUtility batPhoneNumber="+12892782417" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await navigator.clipboard.readText()).toBe("+12892782417");
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("shows a quiet error when the number cannot be copied", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(<BatPhoneCallUtility batPhoneNumber="+12892782417" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "The number could not be copied. Please copy it from the screen.",
    );
  });
});
