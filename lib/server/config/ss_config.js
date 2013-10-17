var path = require('path');
var mime = require('mime');

var SsConfig = function (options) {
  this.cwd = options.cwd || process.cwd();
  this.configuration = {
    files: []
  };
};

SsConfig.prototype.get = function (key) {
  return this.configuration[key];
};

SsConfig.prototype.set = function (key, value) {
  this.configuration[key] = value;
};

SsConfig.prototype.isPath = function (filePath) {
  return path.extname(filePath) === '';
};

SsConfig.prototype.isRoute = function (route) {
  return (path.join('/', route) in this.get('routes'));
};

// Override
SsConfig.prototype.resolvePath = function (originalPath, callback) {
  callback(null, null);
};

// Override
SsConfig.prototype.getErrorPagePath = function () {
  
};

// Override
SsConfig.prototype.configure = function (callback) {
  callback();
};

module.exports = SsConfig;