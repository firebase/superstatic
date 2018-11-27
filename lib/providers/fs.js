/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var crypto = require('crypto');
var fs = require('fs');
var pathjoin = require('join-path');
var RSVP = require('rsvp');
var _ = require('lodash');

var statPromise = RSVP.denodeify(fs.stat);
var multiStat = function(paths) {
  var pathname = paths.shift();
  return statPromise(pathname).then(function(stat) {
    stat.path = pathname;
    return stat;
  }, function(err) {
    if (paths.length) {
      return multiStat(paths);
    }
    return RSVP.reject(err);
  });
};

module.exports = function(options) {
  var etagCache = {};
  var cwd = options.cwd || process.cwd();
  var publicPaths = options.public || ['.'];
  if (!_.isArray(publicPaths)) {
    publicPaths = [publicPaths];
  }

  function _fetchEtag(pathname, stat) {
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
      return fd.pipe(hash);
    });
  }

  return function(req, pathname) {
    pathname = decodeURI(pathname);
    // jumping to parent directories is not allowed
    if (pathname.indexOf('../') >= 0 || pathname.indexOf('..\\') >= 0 || pathname.toLowerCase().indexOf('..%5c') >= 0) {
      return RSVP.resolve(null);
    }

    var result = {};
    var foundPath;
    var fullPathnames = publicPaths.map(function(p) {
      return pathjoin(cwd, p, pathname);
    });

    return multiStat(fullPathnames).then(function(stat) {
      foundPath = stat.path;
      result.modified = stat.mtime.getTime();
      result.size = stat.size;
      return _fetchEtag(stat.path, stat);
    }).then(function(etag) {
      result.etag = etag;
      result.stream = fs.createReadStream(foundPath);
      return result;
    }).catch(function(err) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR' || err.code === 'EISDIR' || err.code === 'EINVAL') {
        return null;
      }
      return RSVP.reject(err);
    });
  };
};
