/**
 * Copyright (c) 2026 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { expect } from "chai";

import { Matcher } from "../../../src/config";
import * as patterns from "../../../src/utils/patterns";

describe("patterns", () => {
  describe("configMatcher", () => {
    it("matches paths using glob", () => {
      expect(
        patterns.configMatcher("/foo/bar.html", { glob: "/foo/*.html" }),
      ).to.equal(true);
      expect(
        patterns.configMatcher("/baz/bar.html", { glob: "/foo/*.html" }),
      ).to.equal(false);
    });

    it("matches paths using source", () => {
      expect(
        patterns.configMatcher("/foo/bar", { source: "/foo/**" }),
      ).to.equal(true);
      expect(
        patterns.configMatcher("/bar/foo", { source: "/foo/**" }),
      ).to.equal(false);
    });

    it("prefers glob over source when both are set", () => {
      const config = { glob: "/foo/*", source: "/other/*" };

      expect(patterns.configMatcher("/foo/bar", config)).to.equal(true);
      expect(patterns.configMatcher("/other/bar", config)).to.equal(false);
    });

    it("matches paths using regex", () => {
      expect(
        patterns.configMatcher("/users/123", { regex: "^/users/\\d+$" }),
      ).to.equal(true);
      expect(
        patterns.configMatcher("/users/abc", { regex: "^/users/\\d+$" }),
      ).to.equal(false);
    });

    it("matches Unicode codepoints in regexes", () => {
      expect(patterns.configMatcher("/äöü", { regex: "^/äöü$" })).to.equal(
        true,
      );
      expect(patterns.configMatcher("/aou", { regex: "^/äöü$" })).to.equal(
        false,
      );
    });

    it("returns false when no matcher is configured", () => {
      expect(patterns.configMatcher("/foo", {} as Matcher)).to.equal(false);
      expect(
        patterns.configMatcher("/foo", { glob: "", source: "", regex: "" }),
      ).to.equal(false);
    });
  });

  describe("createRaw", () => {
    it("creates a matcher with the Unicode flag enabled", () => {
      const regex = patterns.createRaw("^/items/\\p{L}+$");

      expect(regex.flags).to.include("u");
      expect(regex.test("/items/café")).to.equal(true);
      expect(regex.test("/items/123")).to.equal(false);
    });

    it("extracts capture groups when executing against a matching path", () => {
      const regex = patterns.createRaw("/old/(.+)/group/(.+)");

      const match = regex.exec("/old/capture/group/there");

      expect(match?.[1]).to.equal("capture");
      expect(match?.[2]).to.equal("there");
    });

    if (patterns.re2Available()) {
      it("supports RE2 named capture groups when RE2 is loaded", () => {
        const regex = patterns.createRaw("/(?P<section>foo)/bar");

        const match = regex.exec("/foo/bar");

        expect(match?.groups?.section).to.equal("foo");
      });
    } else {
      it("falls back to native RegExp when RE2 is unavailable", () => {
        const regex = patterns.createRaw("^/fallback$");

        expect(regex).to.be.an.instanceOf(RegExp);
      });
    }
  });

  describe("re2Available", () => {
    it("returns a boolean indicating whether RE2 loaded", () => {
      expect(patterns.re2Available()).to.be.a("boolean");
    });
  });

  describe("containsRE2Capture", () => {
    it("returns true when pattern contains an RE2 named capture group", () => {
      expect(patterns.containsRE2Capture("/(?P<name>[^/]+)")).to.equal(true);
    });

    it("returns false when pattern uses PCRE named captures or no captures", () => {
      expect(patterns.containsRE2Capture("/(?<name>[^/]+)")).to.equal(false);
      expect(patterns.containsRE2Capture("/([^/]+)")).to.equal(false);
      expect(patterns.containsRE2Capture("/plain")).to.equal(false);
    });

    it("returns false when pattern is empty or undefined", () => {
      expect(patterns.containsRE2Capture("")).to.equal(false);
      expect(patterns.containsRE2Capture(undefined)).to.equal(false);
    });
  });

  describe("containsPCRECapture", () => {
    it("returns true when pattern contains a PCRE named capture group", () => {
      expect(patterns.containsPCRECapture("/(?<name>[^/]+)")).to.equal(true);
    });

    it("returns false when pattern uses RE2 named captures or no captures", () => {
      expect(patterns.containsPCRECapture("/(?P<name>[^/]+)")).to.equal(false);
      expect(patterns.containsPCRECapture("/([^/]+)")).to.equal(false);
      expect(patterns.containsPCRECapture("/plain")).to.equal(false);
    });

    it("returns false when pattern is empty or undefined", () => {
      expect(patterns.containsPCRECapture("")).to.equal(false);
      expect(patterns.containsPCRECapture(undefined)).to.equal(false);
    });
  });
});
