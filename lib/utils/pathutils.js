var join = require('join-path');
var _ = require('lodash');

var INDEX_FILE = 'index.html';

module.exports = {
  asDirectoryIndex: function(p) {
    return join(p, INDEX_FILE);
  },

  isDirectoryIndex: function(p) {
    return _.endsWith(p, '/' + INDEX_FILE);
  }
};
