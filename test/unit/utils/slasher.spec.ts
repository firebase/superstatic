import { expect } from "chai";
import { slasher } from "../../../src/utils/slasher";

describe("slasher", () => {
  it("adds a leading slash to a plain path", () => {
    expect(slasher("pathname")).to.equal("/pathname");
  });

  it("is idempotent on already-slashed paths", () => {
    expect(slasher("/pathname")).to.equal("/pathname");
  });

  it("handles glob wildcards", () => {
    expect(slasher("**")).to.equal("/**");
    expect(slasher("api/**")).to.equal("/api/**");
  });

  it("handles negated globs", () => {
    expect(slasher("!**/something")).to.equal("!/**/something");
    expect(slasher("!/already/slashed")).to.equal("!/already/slashed");
  });

  it("normalizes double leading slashes", () => {
    expect(slasher("//double")).to.equal("/double");
  });

  it("passes through falsy values", () => {
    expect(slasher(null)).to.equal(null);
    expect(slasher(undefined)).to.equal(undefined);
  });
});
