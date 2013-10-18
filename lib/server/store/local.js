var util = require('util');
var path = require('path');
var fs = require('fs');
var SsStore = require('./base');
var mime = require('mime');

var SsStoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
};

SsStoreLocal.prototype.get = function (filePath) {
  var file = fs.createReadStream(filePath);
  file.type = mime.lookup(filePath);
  return file;
};


module.exports = SsStoreLocal;