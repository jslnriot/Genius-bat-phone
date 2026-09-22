import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    eq: vi.fn(),
    order: vi.fn(),
  };
  query.eq.mockReturnValue(query);

  const profilesQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  profilesQuery.eq.mockReturnValue(profilesQuery);

  return {
    authGetUser: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === "contacts") {
        return {
          select: vi.fn(() => query),
        };
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() => mocks.profilesQuery),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    profilesQuery,
    query,
  };
});

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.authGetUser },
    from: mocks.from,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

import ContactsPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.profilesQuery.eq.mockReturnValue(mocks.profilesQuery);
  mocks.authGetUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  mocks.profilesQuery.maybeSingle.mockResolvedValue({
    data: { phone_number: "+14165550100" },
  });
  mocks.query.order.mockResolvedValue({ data: [], error: null });
});

describe("ContactsPage", () => {
  it("redirects signed-out visitors to account", async () => {
    mocks.authGetUser.mockResolvedValue({ data: { user: null } });

    await expect(ContactsPage()).rejects.toThrow("redirect:/account");
  });

  it("redirects signed-in users without a calling number to onboarding", async () => {
    mocks.profilesQuery.maybeSingle.mockResolvedValue({
      data: { phone_number: null },
    });

    await expect(ContactsPage()).rejects.toThrow("redirect:/onboarding");
  });

  it("renders contacts for a configured user", async () => {
    render(await ContactsPage());

    expect(
      screen.getByRole("heading", { name: "Contacts" }),
    ).toBeInTheDocument();
    expect(mocks.from).toHaveBeenCalledWith("contacts");
  });
});
