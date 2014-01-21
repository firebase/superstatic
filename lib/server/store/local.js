var fs = require('fs');
var path = require('path');
var defaultFileStore = require('./default');

var StoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
};

StoreLocal.prototype = defaultFileStore.create();

StoreLocal.prototype.exists = function (pathname) {
  var fullPath = path.join(this.cwd, pathname);
  
  if (!fs.existsSync(fullPath)) return false;
  if (!fs.statSync(fullPath).isFile()) return false;
  
  return true;
};

module.exports = StoreLocal;