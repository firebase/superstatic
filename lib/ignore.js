var _ = require('lodash');
var minimatch = require('minimatch');

var ignore = {
  globs: [
    '**/.git/**',
    '**.git/**',
    '**/.git**',
    '.git/**',
    '.git**'
  ],
  
  match: function (filePath) {
    return !!_.find(ignore.globs, function (glob) {
      return minimatch(filePath, glob);
    });
  }
};

module.exports = ignore;