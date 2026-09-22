import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfilePhone } from "@/app/onboarding/actions";
import { AccountPhoneForm } from "./account-phone-form";

const refresh = vi.fn();

vi.mock("@/app/onboarding/actions", () => ({
  saveProfilePhone: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("AccountPhoneForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the saved calling number and why it matters", () => {
    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    expect(
      screen.getByRole("heading", { name: "Calling number" }),
    ).toBeInTheDocument();
    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    expect(
      screen.getByText("Calls to Bat Phone must come from this number."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("formats and updates the saved calling number", async () => {
    const user = userEvent.setup();
    vi.mocked(saveProfilePhone).mockResolvedValue({
      success: true,
      data: undefined,
    });

    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Calling number")).toHaveAccessibleDescription(
      "Use the number you’ll call Bat Phone from.",
    );
    await user.clear(screen.getByLabelText("Calling number"));
    await user.type(screen.getByLabelText("Calling number"), "4155550100");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveProfilePhone).toHaveBeenCalledWith("+14155550100");
    expect(await screen.findByText("(415) 555-0100")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Calling number updated.",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("cancels editing without saving changes", async () => {
    const user = userEvent.setup();
    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Calling number"));
    await user.type(screen.getByLabelText("Calling number"), "4155550100");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(saveProfilePhone).not.toHaveBeenCalled();
    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Calling number"),
    ).not.toBeInTheDocument();
  });

  it("keeps calling-number validation on the field", async () => {
    const user = userEvent.setup();
    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Calling number"));
    await user.type(screen.getByLabelText("Calling number"), "123");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveProfilePhone).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a complete 10-digit phone number.",
    );
  });

  it("shows a customer-facing error when the calling number cannot be saved", async () => {
    const user = userEvent.setup();
    vi.mocked(saveProfilePhone).mockResolvedValue({
      success: false,
      message: "Your phone number could not be saved. Please try again.",
    });

    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your phone number could not be saved. Please try again.",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
