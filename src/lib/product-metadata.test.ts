import { describe, expect, it } from "vitest";
import {
  PRODUCT_DESCRIPTION,
  PRODUCT_TITLE,
  productMetadata,
} from "./product-metadata";

describe("product metadata", () => {
  it("uses the customer-facing product title and description", () => {
    expect(PRODUCT_TITLE).toBe("Bat Phone");
    expect(PRODUCT_DESCRIPTION).toBe(
      "Voice calling with automatic recording and transcription.",
    );
    expect(productMetadata.title).toBe(PRODUCT_TITLE);
    expect(productMetadata.description).toBe(PRODUCT_DESCRIPTION);
    expect(productMetadata.applicationName).toBe(PRODUCT_TITLE);
  });
});
