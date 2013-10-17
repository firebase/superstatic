var path = require('path');

var ssDirectoryIndex = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  if (req.superstatic && req.superstatic.path) return next();
  
  if (path.basename(req.url) === 'index') {
    res.writeHead(301, { Location: path.dirname(req.url) });
    return res.end();
  }
  var index = internals.isDirectoryIndex(req.url);
  
  if (!index) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(index);
  
  next();
};

var internals = {
  isDirectoryIndex: function (filePath) {
    var isIndex = false;
    var fullPath = internals.router._buildRelativePath(path.join(filePath, 'index.html'));
    
    if (internals.router.isFile(fullPath)) {
      isIndex = path.join(filePath, 'index.html');
    }
    
    return isIndex;
  }
};

ssDirectoryIndex.internals = internals;
module.exports = ssDirectoryIndex;