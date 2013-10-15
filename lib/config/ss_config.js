var path = require('path');
var mime = require('mime');

var SsConfig = function (options) {
  this.cwd = options.cwd || process.cwd();
  this.configuration = {
    files: []
  };
};

// Override
SsConfig.prototype.loadConfiguration = function (callback) {
  if (callback) {
    callback();
  }
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
  callback(null, '/');
};

SsConfig.prototype.getErrorPage = function () {
  return this.get('error_page') || path.resolve(__dirname, '../error.html');
};


module.exports = SsConfig;