var util = require('util');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

var StoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
};

StoreLocal.prototype.get = function (filePath) {
  
  var file = fs.createReadStream(path.join('/', this.cwd, filePath));
  file.type = mime.lookup(filePath);
  return file;
};


module.exports = StoreLocal;