const { expect } = require("chai");

const pathutils = require("../../../lib/utils/pathutils");

describe("pathutils", () => {
  describe("asDirectoryIndex", () => {
    it("should append `index.html` if it does not already", () => {
      expect(pathutils.asDirectoryIndex("path/to/dir")).to.equal(
        "path/to/dir/index.html"
      );
      expect(pathutils.asDirectoryIndex("path/to/index.html")).to.equal(
        "path/to/index.html"
      );
    });
  });

  describe("isDirectoryIndex", () => {
    it("should return true if the path ends with `index.html`", () => {
      expect(pathutils.isDirectoryIndex("path/to/file.txt")).to.be.false;
      expect(pathutils.isDirectoryIndex("path/to/index.html")).to.be.true;
    });
  });

  describe("removeTrailingSlash", () => {
    it("should return the path without any trailing slash", () => {
      expect(pathutils.removeTrailingSlash("path/to/file")).to.equal(
        "path/to/file"
      );
      expect(pathutils.removeTrailingSlash("path/to/slash/")).to.equal(
        "path/to/slash"
      );
    });
  });
});
