import { expect } from "chai";
import { i18nContentOptions } from "../../../src/utils/i18n";

describe("i18nContentOptions", () => {
  it("should return no files with no i18n config", () => {
    const paths = i18nContentOptions("/index.html", {
      superstatic: {},
      headers: { "accept-language": "fr" },
    });

    expect(paths).to.have.members([]);
  });

  it("should return a list of files for language fr", () => {
    const paths = i18nContentOptions("/index.html", {
      superstatic: { i18n: { root: "/i18n" } },
      headers: { "accept-language": "fr" },
    });

    expect(paths).to.have.members([
      "/i18n/fr_ALL/index.html",
      "/i18n/fr/index.html",
    ]);
  });

  it("should return a list of files for country ca", () => {
    const paths = i18nContentOptions("/index.html", {
      superstatic: { i18n: { root: "/i18n" } },
      headers: { "x-country-code": "ca" },
    });

    expect(paths).to.have.members(["/i18n/ALL_ca/index.html"]);
  });

  it("should return a list of files for language fr and country ca", () => {
    const paths = i18nContentOptions("/index.html", {
      superstatic: { i18n: { root: "/i18n" } },
      headers: { "accept-language": "fr", "x-country-code": "ca" },
    });

    expect(paths).to.have.members([
      "/i18n/fr_ca/index.html",
      "/i18n/ALL_ca/index.html",
      "/i18n/fr_ALL/index.html",
      "/i18n/fr/index.html",
    ]);
  });
});
