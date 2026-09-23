import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("./globals.css", () => ({}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { metadata, viewport } from "./layout";
import { productMetadata } from "@/lib/product-metadata";

describe("root layout metadata", () => {
  it("exports customer-facing browser metadata", () => {
    expect(metadata.title).toBe(productMetadata.title);
    expect(metadata.description).toBe(productMetadata.description);
    expect(metadata.applicationName).toBe(productMetadata.applicationName);
  });

  it("exports mobile viewport and theme color", () => {
    expect(viewport.width).toBe("device-width");
    expect(viewport.viewportFit).toBe("cover");
    expect(viewport.themeColor).toBe("#FFFFFF");
  });
});
