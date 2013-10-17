var fs = require('fs');
var path = require('path');
var mime = require('mime');

var SsStore = function (options) {
  
};

SsStore.prototype.getMimeType = function (filePath) {
  return mime.lookup(filePath);
};

module.exports = SsStore;