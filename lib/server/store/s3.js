var path = require('path');
var knox = require('knox');
var request = require('request');
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
  var fileStream = request({
    method: 'GET',
    url: signedUrl,
    headers: {
      'Content-Type': mime.lookup(filePath)
    }
  });
  
  fileStream.type = mime.lookup(filePath);
  return fileStream
};

module.exports = StoreS3;