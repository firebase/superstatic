var util = require('util');
var path = require('path');
var fs = require('fs');
var SsStore = require('./ss_store');

var SsStoreLocal = function (options) {
  this.cwd = options.cwd || process.cwd();
  
  SsStore.apply(this, arguments);
};

util.inherits(SsStoreLocal, SsStore);

SsStoreLocal.prototype.createReadStream = function (filePath) {
  var file = fs.createReadStream(path.join(this.cwd, filePath));
  file.type = this.getMimeType(filePath);
  return file;
};


module.exports = SsStoreLocal;