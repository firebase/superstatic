/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var path = require('path');

var fs = require('fs-extra');
var send = require('send');
var join = require('join-path');
var etag = require('etag');
var crypto = require('crypto');

var ROOT = './';
var INDEX_FILE = 'index.html';
var CWD = process.cwd();

var etagCache = {};

module.exports = function (config) {

  // current working directory is needed because
  // superstatic can handle running in a child directory
  var _cwd = config.cwd || CWD;
  var _root = config.public || config.root || ROOT;

  var _indexFile = config.index || INDEX_FILE;

  function get(req, pathname, callback) {
    var stats = {};
    var fullPathname = fullpath(pathname);

    fs.stat(fullPathname, function(err, stat) {
      if (err) { return callback(err); }
      _fetchEtag(fullPathname, stat, function(etagerr, etag) {
        if (etagerr) { return callback(etagerr); }
        stats.etag = etag;
        stats.modified = stat.mtime;
        stats.size = stat.size;

        callback(null, stats, fs.createReadStream(fullPathname));
      });
    });
  }

  function _fetchEtag(pathname, stat, callback) {
    var cached = etagCache[pathname];
    if (cached && cached.timestamp === stat.mtime) {
      callback(null, cached.value);
    } else {
      // the file you want to get the hash
      var fd = fs.createReadStream(pathname);
      var hash = crypto.createHash('md5');
      hash.setEncoding('hex');

      fd.on('error', function(err) {
        callback(err);
      });

      fd.on('end', function() {
          hash.end();
          var etag = hash.read();
          etagCache[pathname] = {
            timestamp: stat.mtime,
            value: etag
          };
          callback(null, etag);
      });

      // read all file and pipe it (write it) to the hash object
      fd.pipe(hash);
    }
  }

  function exists (pathname, done) {

    fs.exists(fullpath(pathname), done);
  }

  function isFile (pathname, done) {

    fs.stat(fullpath(pathname), function (err, stats) {

      if (err) {
        return done(false);
      }

      done(stats.isFile());
    });
  }

  function isDirectory (pathname, done) {

    fs.stat(fullpath(pathname), function (err, stats) {

      if (err) {
        return done(false);
      }

      done(stats.isDirectory());
    });
  }

  function isDirectoryIndex (pathname, done) {

    exists(join(pathname, _indexFile), done);
  }

  function createReadStream (pathname, spec) {

    return fs.createReadStream(fullpath(pathname));
  }

  function asDirectoryIndex (pathname) {

    return join(pathname, _indexFile);
  }

  function stat (pathname, done) {

    fs.stat(fullpath(pathname), done);
  }

  function generateEtag (data, encoding, isStat) {

    encoding = encoding || 'utf8';

    if (!(data instanceof fs.Stats)) {
      data = !Buffer.isBuffer(data)
        ? new Buffer(data, encoding)
        : data;
    }

    return etag(data, {weak: false});
  }

  // TODO: expose this as a "resolve" function. This not
  // only lets it be overridden, but allows future providers
  // to have more flexibility
  function fullpath (pathname) {

    return join(_cwd, _root, pathname);
  }

  return Object.freeze({
    get: get,
    exists: exists,
    createReadStream: createReadStream,
    isFile: isFile,
    isDirectory: isDirectory,
    isDirectoryIndex: isDirectoryIndex,
    asDirectoryIndex: asDirectoryIndex,
    stat: stat,
    generateEtag: generateEtag,
  });
};
