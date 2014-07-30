var defaultFileStore = require('./default');

var StoreS3 = function (options) {
  options = options || {};
  
  this.cwd = options.cwd || './';
  this._client = options.client;
  this._legacyClient = options._legacyClient;
  this._hashedClient = options._hashedClient;
};

StoreS3.prototype = defaultFileStore.create();

// StoreS3.prototype._generateSignedUrl = function (filePath) {
//   return this._client.signedUrl(filePath, new Date(Date.now() + 50000));
// };

StoreS3.prototype.getPath = function (settings, filePath) {
  var expiresAt = new Date(Date.now() + 50000);
  var regex = new RegExp("/" + settings.build.id + "/")
  var path = settings.getPath(filePath.replace(regex, ''));
  var url;

  if (settings.build.file_mapped) {
    url = this._hashedClient.signedUrl(path, expiresAt);
  }
  else {
    url = this._legacyClient.signedUrl([settings.build.id,path].join(''), expiresAt);
  }
  
  return url;
};

StoreS3.prototype.fullPath = function (settings, pathname) {
  var u = this.getPath(settings, pathname);
  var parsed = u.split('/');
  var root = parsed[0] + '//' + parsed[2];
  var parsedUrl = parsed.slice(3).join('/');
  
  return {
    root: root,
    pathname: parsedUrl
  }
};


module.exports = StoreS3;