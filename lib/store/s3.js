var defaultFileStore = require('./default');

var StoreS3 = function (options) {
  options = options || {};

  this.cwd = options.cwd || './';
  this._client = options.client;
  this._legacyClient = options._legacyClient;
  this._hashedClient = options._hashedClient;
};

StoreS3.prototype = defaultFileStore.create();

StoreS3.prototype.getPath = function (settings, filePath) {
  var expiresAt = new Date(Date.now() + 300000);
  var regex = new RegExp("/" + settings.build.id + "/");
  var path = settings.getPath(filePath.replace(regex, ''));
  var url;

  if (!path) return;

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
  var root = '/';
  var parsedUrl = pathname;

  // Only parse it if this is a parseable S3 hashed url
  if (u) {
    var parsed = u.split('/');

    root = parsed[0] + '//' + parsed[2];
    parsedUrl = parsed.slice(3).join('/');
  }

  return {
    root: root,
    pathname: parsedUrl
  };
};


module.exports = StoreS3;