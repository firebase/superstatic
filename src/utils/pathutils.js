const join = require("join-path");
const _ = require("lodash");

const INDEX_FILE = "index.html";

const pathutils = {
  asDirectoryIndex: (pathname) => {
    return pathutils.isDirectoryIndex(pathname)
      ? pathname
      : join(pathname, INDEX_FILE);
  },

  isDirectoryIndex: (pathname) => {
    return _.endsWith(pathname, "/" + INDEX_FILE);
  },

  hasTrailingSlash: (pathname) => {
    return _.endsWith(pathname, "/");
  },

  addTrailingSlash: (pathname) => {
    return pathutils.hasTrailingSlash(pathname) ? pathname : pathname + "/";
  },

  removeTrailingSlash: (pathname) => {
    return pathutils.hasTrailingSlash(pathname)
      ? pathname.slice(0, pathname.length - 1)
      : pathname;
  },

  normalizeMultiSlashes: (pathname) => {
    return pathname.replace(/\/+/g, "/");
  },

  removeTrailingString: (string, rm) => {
    if (!_.endsWith(string, rm)) {
      return string;
    }
    return string.slice(0, string.lastIndexOf(rm));
  }
};

module.exports = pathutils;
