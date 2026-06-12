import { expect } from "chai";

import * as pathutils from "../../../src/utils/pathutils";

describe("pathutils", () => {
  describe("asDirectoryIndex", () => {
    it("should append `index.html` if it does not already", () => {
      expect(pathutils.asDirectoryIndex("path/to/dir")).to.equal(
        "path/to/dir/index.html",
      );
      expect(pathutils.asDirectoryIndex("path/to/index.html")).to.equal(
        "path/to/index.html",
      );
    });
  });

  describe("isDirectoryIndex", () => {
    it("should return true if the path ends with `index.html`", () => {
      expect(pathutils.isDirectoryIndex("path/to/file.txt")).to.equal(false);
      expect(pathutils.isDirectoryIndex("path/to/index.html")).to.equal(true);
    });
  });

  describe("addTrailingSlash", () => {
    it("should return the path with a trailing slash", () => {
      expect(pathutils.addTrailingSlash("path/to/file")).to.equal(
        "path/to/file/",
      );
      expect(pathutils.addTrailingSlash("path/to/slash/")).to.equal(
        "path/to/slash/",
      );
    });
  });

  describe("removeTrailingSlash", () => {
    it("should return the path without any trailing slash", () => {
      expect(pathutils.removeTrailingSlash("path/to/file")).to.equal(
        "path/to/file",
      );
      expect(pathutils.removeTrailingSlash("path/to/slash/")).to.equal(
        "path/to/slash",
      );
    });
  });

  describe("normalizeMultiSlashes", () => {
    it("should return the path without double slashes", () => {
      expect(pathutils.normalizeMultiSlashes("path/to///file")).to.equal(
        "path/to/file",
      );
      expect(pathutils.normalizeMultiSlashes("path//to/slash//")).to.equal(
        "path/to/slash/",
      );
      expect(pathutils.normalizeMultiSlashes("path/to/slash/")).to.equal(
        "path/to/slash/",
      );
    });
  });

  describe("removeTrailingString", () => {
    it("should return the path without double slashes", () => {
      expect(pathutils.removeTrailingString("hello/world", "nothing")).to.equal(
        "hello/world",
      );
      expect(pathutils.removeTrailingString("hello/world", "/world")).to.equal(
        "hello",
      );
    });
  });

  describe("slasher", () => {
    it("should prepend a slash if not present", () => {
      expect(pathutils.slasher("foo/bar")).to.equal("/foo/bar");
      expect(pathutils.slasher("foo\\bar")).to.equal("/foo/bar");
    });

    it("should not prepend a slash if already present", () => {
      expect(pathutils.slasher("/foo/bar")).to.equal("/foo/bar");
    });

    it("should handle negated glob patterns", () => {
      expect(pathutils.slasher("!foo/bar")).to.equal("!/foo/bar");
      expect(pathutils.slasher("!/foo/bar")).to.equal("!/foo/bar");
    });

    it("should normalize multiple slashes", () => {
      expect(pathutils.slasher("foo//bar")).to.equal("/foo/bar");
      expect(pathutils.slasher("!foo///bar")).to.equal("!/foo/bar");
    });

    it("should convert backslashes to forward slashes", () => {
      expect(pathutils.slasher("foo\\bar\\baz")).to.equal("/foo/bar/baz");
      expect(pathutils.slasher("!foo\\bar")).to.equal("!/foo/bar");
    });

    it("should recursively process arrays", () => {
      expect(
        pathutils.slasher(["foo/bar", "!baz/qux", "/already/slashed"]),
      ).to.deep.equal(["/foo/bar", "!/baz/qux", "/already/slashed"]);
    });

    it("should recursively process objects without slashing keys", () => {
      const input = {
        "key1/path": "val1/path",
        "key2\\path": {
          "nested/key": "nested/value",
        },
      };
      const expected = {
        "key1/path": "/val1/path",
        "key2\\path": {
          "nested/key": "/nested/value",
        },
      };
      expect(pathutils.slasher(input)).to.deep.equal(expected);
    });

    it("should leave non-string, non-array, non-object values as-is", () => {
      expect(pathutils.slasher(null)).to.equal(null);
      expect(pathutils.slasher(undefined)).to.equal(undefined);
      expect(pathutils.slasher(123)).to.equal(123);
      expect(pathutils.slasher(true)).to.equal(true);
    });
  });
});
