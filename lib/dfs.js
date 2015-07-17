var path = require('path');

var fs = require('fs-extra');
var send = require('send');
var join = require('join-path');
var etag = require('etag');

var ROOT = './';
var INDEX_FILE = 'index.html';
var CWD = process.cwd();

module.exports = function (config) {

  // current working directory is needed because
  // superstatic can handle running in a child directory
  var _cwd = config.cwd || CWD;
  var _root = config.public || config.root || ROOT;

  var _indexFile = config.index || INDEX_FILE;

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
