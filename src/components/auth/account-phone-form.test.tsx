import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("formats and updates the saved calling number", async () => {
    const user = userEvent.setup();
    vi.mocked(saveProfilePhone).mockResolvedValue({
      success: true,
      data: undefined,
    });

    render(<AccountPhoneForm initialPhoneNumber="+12125550199" />);

    expect(screen.getByText("(212) 555-0199")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.clear(screen.getByLabelText("Phone number"));
    await user.type(screen.getByLabelText("Phone number"), "4155550100");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveProfilePhone).toHaveBeenCalledWith("+14155550100");
    expect(await screen.findByText("(415) 555-0100")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});
