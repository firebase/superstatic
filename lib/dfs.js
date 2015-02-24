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
  var _root = config.root || ROOT;
  var _indexFile = config.index || INDEX_FILE;
  
  function exists (pathname, done) {
    
    fs.exists(fullpath(pathname), done);
  }
  
  function existsSync (pathname) {
    
    return fs.existsSync(fullpath(pathname));
  }
  
  function isDirectory (pathname, done) {
    
    fs.stat(fullpath(pathname), function (err, stats) {
      
      if (err) {
        done(false);
      }
      
      done(stats.isDirectory());
    });
  }
  
  function isDirectorySync (pathname) {
    
    return fs.statSync(fullpath(pathname)).isDirectory();
  }
  
  function isDirectoryIndex (pathname, done) {
    
    exists(join(pathname, _indexFile), done);
  }
  
  function isDirectoryIndexSync (pathname) {
    
    return existsSync(join(pathname, _indexFile));
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
  
  function statSync (pathname) {
    
    return fs.statSync(fullpath(pathname));
  }
  
  function generateEtag (data, encoding) {
    
    var buf = !Buffer.isBuffer(data)
      ? new Buffer(data, encoding)
      : data;

    return etag(buf, {weak: false});
  }
  
  function cacheIsFresh (req, res) {
    
    var reqEtag = req.headers['if-none-match'];
    var resEtag = res.getHeader('ETag');
    
    // If etags disabled, don't want to assume
    // that undefined etags are equal
    if (reqEtag === undefined || resEtag === undefined) {
      return false;
    }
    
    return reqEtag === resEtag;
  }
  
  // TODO: expose this as a "resolve" function. This not
  // only lets it be overridden, but allows future providers
  // to have more flexibility
  function fullpath (pathname) {
    
    return join(_cwd, _root, pathname);
  }
  
  return Object.freeze({
    exists: exists,
    existsSync: existsSync,
    
    createReadStream: createReadStream,
    
    isDirectory: isDirectory,
    isDirectorySync: isDirectorySync,
    
    isDirectoryIndex: isDirectoryIndex,
    isDirectoryIndexSync: isDirectoryIndexSync,
    
    asDirectoryIndex: asDirectoryIndex,
    
    stat: stat,
    statSync: statSync,
    
    // Etag support
    // TODO: test these
    generateEtag: generateEtag,
    cacheIsFresh: cacheIsFresh
  });
};