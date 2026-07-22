import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

const promiseback = require("../../../src/utils/promiseback");

describe("promiseback", () => {
  it("should resolve a promise if one is returned", () => {
    return expect(
      promiseback((a1: any, a2: any) => {
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
      promiseback(() => {
        return Promise.reject(new Error("broken"));
      }, 2)("foo", "bar"),
    ).to.be.rejectedWith("broken");
  });

  it("should reject an errback if one is used and errors", () => {
    return expect(
      promiseback((a1: any, a2: any, cb: any) => {
        cb(a2);
      }, 2)("foo", "bar"),
    ).to.be.rejectedWith("bar");
  });

  it("should resolve an errback if one is used and resolves", () => {
    return expect(
      promiseback((a1: any, a2: any, cb: any) => {
        cb(null, a2);
      }, 2)("foo", "bar"),
    );
  });
});
