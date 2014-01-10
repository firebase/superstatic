var path = require('path');

var static = function () {
  return function (req, res, next) {
    var indexFile = req.config.index;
    
    var pathname = (static.isDirectoryIndex(req, req.ss.pathname, indexFile))
      ? path.join(req.rootPathname(req.ss.pathname), indexFile)
      : req.ss.pathname;
    
    if (!req.settings.isFile(req.rootPathname(pathname))) return next();
    
    res.send(pathname);
  };
};

static.isDirectoryIndex = function (req, pathname, indexFile) {
  return req.settings.isFile(path.join(req.rootPathname(pathname), indexFile));
};

module.exports = static;