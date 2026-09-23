import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveProfilePhone } from "@/app/onboarding/actions";
import { OnboardingForm } from "./onboarding-form";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/app/onboarding/actions", () => ({
  saveProfilePhone: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveProfilePhone).mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("tells the user to use the number they will call from", () => {
    render(<OnboardingForm />);

    expect(
      screen.getByText("Enter the number you’ll call Bat Phone from."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
      "Enter the number you’ll call Bat Phone from.",
    );
  });

  it("continues to contacts after a successful save", async () => {
    render(<OnboardingForm />);

    await userEvent.type(screen.getByLabelText("Phone number"), "4165550100");
    await userEvent.click(
      screen.getByRole("button", { name: "Save and continue" }),
    );

    expect(saveProfilePhone).toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith("/contacts");
  });
});
