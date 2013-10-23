var path = require('path');

var directoryIndex = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  var settings = internals.settings = req.ss.settings;
  
  if (!req.ss.config) return next();
  if (req.superstatic && req.superstatic.path) return next();
  
  if (path.basename(req.url) === 'index') {
    res.writeHead(301, { Location: path.dirname(req.url) });
    return res.end();
  }
  
  var index = internals.isDirectoryIndex(req);
  
  if (!index) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(index);
  
  next();
};

var internals = {
  isDirectoryIndex: function (req) {
    var isIndex = false;
    var filePath = req.url;
    var fullPath = internals.router._buildRelativePath(path.join(filePath, 'index.html'));
    var isFile = internals.router.isFile(fullPath)
    
    if (isFile) {
      isIndex = path.join(filePath, 'index.html');
    }
    
    return isIndex;
  }
};

directoryIndex.internals = internals;
module.exports = directoryIndex;