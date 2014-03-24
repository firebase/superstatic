var _ = require('lodash');
var minimatch = require('minimatch');

var ignore = {
  globs: [
    '.**/**',
    '.**'
  ],
  
  match: function (filePath) {
    return !!_.find(ignore.globs, function (glob) {
      return minimatch(filePath, glob);
    });
  }
};

module.exports = ignore;