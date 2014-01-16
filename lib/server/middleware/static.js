var path = require('path');
var join = path.join

var static = function () {
  return function (req, res, next) {
    var indexFile = req.config.index;
    
    var pathname = (static.isDirectoryIndex(req, req.ss.pathname, indexFile))
      ? join(req.rootPathname(req.ss.pathname), indexFile)
      : req.rootPathname(req.ss.pathname);
    
    if (!req.settings.isFile(pathname)) return next();
    
    res.send(pathname);
  };
};

static.isDirectoryIndex = function (req, pathname, indexFile) {
  return req.settings.isFile(join(req.rootPathname(pathname), indexFile));
};

module.exports = static;