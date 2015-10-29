var crypto = require('crypto');
var fs = require('fs');
var pathjoin = require('join-path');
var RSVP = require('rsvp');

var _stat = RSVP.denodeify(fs.stat);

module.exports = function(options) {
  var etagCache = {};
  var cwd = options.cwd || process.cwd();
  var publicPath = options.public || '.';

  function _fetchEtag(pathname, stat, callback) {
    return new RSVP.Promise(function(resolve, reject) {
      var cached = etagCache[pathname];
      if (cached && cached.timestamp === stat.mtime) {
        return resolve(cached.value);
      }

      // the file you want to get the hash
      var fd = fs.createReadStream(pathname);
      var hash = crypto.createHash('md5');
      hash.setEncoding('hex');

      fd.on('error', function(err) {
        reject(err);
      });

      fd.on('end', function() {
        hash.end();
        var etag = hash.read();
        etagCache[pathname] = {
          timestamp: stat.mtime,
          value: etag
        };
        resolve(etag);
      });

      // read all file and pipe it (write it) to the hash object
      fd.pipe(hash);
    });
  }

  return function(req, pathname) {
    var result = {};
    var fullPathname = pathjoin(cwd, publicPath, pathname);

    return _stat(fullPathname).then(function(stat) {
      result.modified = stat.mtime.getTime();
      result.size = stat.size;
      return _fetchEtag(fullPathname, stat);
    }).then(function(etag) {
      result.etag = etag;
      result.stream = fs.createReadStream(fullPathname);
      return result;
    }).catch(function (err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR' || err.code === 'EISDIR') {
        return null;
      }
      return RSVP.reject(err);
    });
  };
};
