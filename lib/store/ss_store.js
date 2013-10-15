var fs = require('fs');
var path = require('path');
var mime = require('mime');

var SsStore = function (options) {
  
};

SsStore.prototype.getMimeType = function (filePath) {
  return mime.lookup(filePath);
};

module.exports = SsStore;


/*
exports.FileStore = function (env, knox, path, request) {
  env = env.getLocal();
  
  function FileStore (appId, releaseId) {
    this.appId = appId;
    this.releaseId = releaseId;
    this._filePathPrefix = path.join(this.appId, this.releaseId);
    this._client = knox.createClient({
      key: env.S3_KEY,
      secret: env.S3_SECRET,
      bucket: env.S3_BUCKET
    });
  }
  
  FileStore.prototype.getFilePathPrefix = function () {
    return this._filePathPrefix;
  };
  
  FileStore.prototype.getSignedUrl = function (filePath) {
    return this._client.signedUrl(path.join(this.getFilePathPrefix(), filePath), new Date(Date.now() + 50000));
  };
  
  FileStore.prototype.createReadStream = function (filePath) {
    var signedUrl = this.getSignedUrl(filePath);
    return request.get(signedUrl);
  };
  
  return FileStore;
};
 */