var path = require('path');
var knox = require('knox');
var hyperquest = require('hyperquest');
var mime = require('mime');

var StoreS3 = function (options) {
  this.cwd = options.cwd || './';
  this._client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });
};

StoreS3.prototype._generateSignedUrl = function (filePath) {
  return this._client.signedUrl(filePath, new Date(Date.now() + 50000));
};

StoreS3.prototype.get = function (filePath) {
  var signedUrl = this._generateSignedUrl(filePath);
  var fileStream = hyperquest.get(signedUrl);
  
  fileStream.type = mime.lookup(filePath);
  return fileStream
};

module.exports = StoreS3;