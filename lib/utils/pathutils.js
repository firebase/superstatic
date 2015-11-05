'use strict';

var join = require('join-path');
var _ = require('lodash');

var INDEX_FILE = 'index.html';

var pathutils = {
  asDirectoryIndex: function(p) {
    return join(p, INDEX_FILE);
  },

  isDirectoryIndex: function(p) {
    return _.endsWith(p, '/' + INDEX_FILE);
  },

  hasTrailingSlash: function(p) {
    return _.endsWith(p, '/');
  },

  addTrailingSlash: function(p) {
    return pathutils.hasTrailingSlash(p) ? p : p + '/';
  },

  removeTrailingSlash: function(p) {
    return pathutils.hasTrailingSlash(p) ? p.slice(0,p.length - 1) : p;
  }
};

module.exports = pathutils;
