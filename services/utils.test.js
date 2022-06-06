import { parseCharsetFromContentType } from "./utils.js";

describe("Test getGifId", () => {
  it("work", () => {
    let result;
    result = parseCharsetFromContentType("text/html; charset=utf-8");
    expect(result).toBe("utf-8");
  });
});
