'use strict';

var join = require('join-path');
var _ = require('lodash');

var INDEX_FILE = 'index.html';

var pathutils = {
  asDirectoryIndex: function(pathname) {
    return pathutils.isDirectoryIndex(pathname) ? pathname : join(pathname, INDEX_FILE);
  },

  isDirectoryIndex: function(pathname) {
    return _.endsWith(pathname, '/' + INDEX_FILE);
  },

  hasTrailingSlash: function(pathname) {
    return _.endsWith(pathname, '/');
  },

  addTrailingSlash: function(pathname) {
    return pathutils.hasTrailingSlash(pathname) ? pathname : pathname + '/';
  },

  removeTrailingSlash: function(pathname) {
    return pathutils.hasTrailingSlash(pathname) ? pathname.slice(0, pathname.length - 1) : pathname;
  },

  normalizeMultiSlashes: function(pathname) {
    return pathname.replace(/\/+/g, '/');
  },

  removeTrailingString: function(string, rm) {
    if (!_.endsWith(string, rm)) {
      return string;
    }
    return string.slice(0, string.lastIndexOf(rm));
  }
};

module.exports = pathutils;
