const { expect, use } = require("chai");
use(require("chai-as-promised"));

const promiseback = require("../../../lib/utils/promiseback");

describe("promiseback", () => {
  it("should resolve a promise if one is returned", () => {
    return expect(
      promiseback((a1, a2) => {
        return Promise.resolve({
          a: a1,
          b: a2
        });
      }, 2)("foo", "bar")
    ).to.eventually.deep.eq({
      a: "foo",
      b: "bar"
    });
  });

  it("should reject a promise if one is rejected", () => {
    return expect(
      promiseback(() => {
        return Promise.reject(new Error("broken"));
      }, 2)("foo", "bar")
    ).to.be.rejectedWith("broken");
  });

  it("should reject an errback if one is used and errors", () => {
    return expect(
      promiseback((a1, a2, cb) => {
        cb(a2);
      }, 2)("foo", "bar")
    ).to.be.rejectedWith("bar");
  });

  it("should resolve an errback if one is used and resolves", () => {
    return expect(
      promiseback((a1, a2, cb) => {
        cb(null, a2);
      }, 2)("foo", "bar")
    );
  });
});
