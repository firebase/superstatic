var path = require('path');
var qs = require('querystring');

var directoryIndex = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  if (!req.ss.config) return next();
  if (path.basename(req.ss.pathname, '.html') === 'index') return internals.redirect(req, res);
  
  var router = internals.router = req.ssRouter;
  var settings = internals.settings = req.ss.settings;
  var index;
  
  if (!(index = internals.isDirectoryIndex(req))) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(index);
  req.superstatic.relativePath = index;
  
  next();
};

var internals = {
  isDirectoryIndex: function (req) {
    var isIndex = false;
    var filePath = req.ss.pathname;
    var fullPath = internals.router._buildRelativePath(path.join(filePath, 'index.html'));
    var isFile = internals.router.isFile(fullPath);
    
    if (isFile) {
      isIndex = path.join(filePath, 'index.html');
    }
    
    return isIndex;
  },
  
  redirect: function (req, res) {
    var redirectUrl = path.dirname(req.ss.pathname);
    var query = qs.stringify(req.query);
    redirectUrl += (query) ? '?' + query : '';
    
    res.writeHead(301, { Location: redirectUrl });
    res.end();
  }
};

directoryIndex.internals = internals;
module.exports = directoryIndex;