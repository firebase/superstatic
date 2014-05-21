var mime = require('mime');
var defaultFileStore = require('./default');

var StoreS3 = function (options) {
  options = options || {};
  
  this.cwd = options.cwd || './';
  this._client = options.client;
};

StoreS3.prototype = defaultFileStore.create();

StoreS3.prototype._generateSignedUrl = function (filePath) {
  return this._client.signedUrl(filePath, new Date(Date.now() + 50000));
};

StoreS3.prototype.getPath = function (filePath) {
  return this._generateSignedUrl(filePath);
};

module.exports = StoreS3;