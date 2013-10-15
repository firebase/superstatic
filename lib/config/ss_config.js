var path = require('path');
var mime = require('mime');

var SsConfig = function (options) {
  this.cwd = options.cwd || process.cwd();
  this.configuration = {
    files: []
  };
};

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

SsConfig.prototype.hasFile = function (fileName) {
  var name = path.join('/', fileName);
  return this.get('files').indexOf(name) > -1;
};

SsConfig.prototype.isPath = function (filePath) {
  return path.extname(filePath) === '';
};

SsConfig.prototype.isRoute = function (route) {
  route = path.join('/', route);
  return (route in this.get('routes'));
};

SsConfig.prototype.resolvePath = function (originalPath) {
  var self = this;
  var filePath = './error.html'
  
  if (this.isRoute(originalPath)) {
    filePath = this.get('routes')[originalPath];
  }
  
  return filePath;
};


SsConfig.prototype.resolvePathToFile = function (filePath) {
  return filePath += '.html';
};

SsConfig.prototype.pathIsStatic = function (filePath) {
  return this.hasFile(filePath);
};

SsConfig.prototype.pathIsFile = function (filePath) {
  return this.hasFile(filePath + '.html');
};

SsConfig.prototype.getErrorPage = function () {
  return this.get('error_page') || path.resolve(__dirname, '../error.html');
};


module.exports = SsConfig;