var path = require('path');

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
  return this.configuration.files.indexOf(name) > -1;
};

SsConfig.prototype.pathIsFile = function (fileName) {
  var ext = path.extname(fileName);
  
  if(ext === '.html') {
    return true;
  }
  
  if (!this.configuration.clean_urls) {
    return false;
  }
  
  return this.hasFile(fileName + '.html');
};


module.exports = SsConfig;