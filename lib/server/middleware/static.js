var path = require('path');
var join = path.join

var static = function () {
  return function (req, res, next) {
    var indexFile = req.config.index;
    var originalPathname = req.ss.pathname;
    var rootPathname = req.rootPathname(originalPathname);
    var settings = req.settings;
    
    var pathname = (static.isDirectoryIndex(settings, rootPathname, indexFile))
      ? join(rootPathname, indexFile)
      : rootPathname;
    
    if (!settings.isFile(pathname)) return next();
    
    res.send(pathname);
  };
};

static.isDirectoryIndex = function (settings, rootPathname, indexFile) {
  return settings.isFile(join(rootPathname, indexFile));
};

module.exports = static;