import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import promiseback = require("../../../src/utils/promiseback");

use(chaiAsPromised);

describe("promiseback", () => {
  it("should resolve a promise if one is returned", () => {
    return expect(
      promiseback((a1: string, a2: string) => {
        return Promise.resolve({
          a: a1,
          b: a2,
        });
      }, 2)("foo", "bar"),
    ).to.eventually.deep.eq({
      a: "foo",
      b: "bar",
    });
  });

  it("should reject a promise if one is rejected", () => {
    return expect(
      promiseback<[string, string], never>(() => {
        return Promise.reject(new Error("broken"));
      }, 2)("foo", "bar"),
    ).to.be.rejectedWith("broken");
  });

  it("should reject an errback if one is used and errors", () => {
    return expect(
      promiseback(
        (a1: string, a2: string, cb: (err: unknown, res?: unknown) => void) => {
          cb(a2);
        },
        2,
      )("foo", "bar"),
    ).to.be.rejectedWith("bar");
  });

  it("should resolve an errback if one is used and resolves", () => {
    return expect(
      promiseback(
        (a1: string, a2: string, cb: (err: unknown, res?: string) => void) => {
          cb(null, a2);
        },
        2,
      )("foo", "bar"),
    ).to.eventually.eq("bar");
  });
});
