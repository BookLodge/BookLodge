import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { generateClientReference } = require("../../src/utils/generateRef.js");

describe("generateClientReference", () => {
  it("returns a string", () => {
    expect(typeof generateClientReference()).toBe("string");
  });

  it("returns a reference in the BookLodge format", () => {
    expect(generateClientReference()).toMatch(
      /^BL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("returns a different reference on each call", () => {
    expect(generateClientReference()).not.toBe(generateClientReference());
  });
});
