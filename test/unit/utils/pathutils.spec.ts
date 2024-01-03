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
      expect(pathutils.isDirectoryIndex("path/to/file.txt")).to.be.false;
      expect(pathutils.isDirectoryIndex("path/to/index.html")).to.be.true;
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
});
