var path = require('path');
var join = path.join;
var url = require('url');

var static = function (settings) {
  return function (req, res, next) {
    if (!req.config) return next();
    
    var indexFile = req.config.index;
    var originalPathname = url.parse(req.url).pathname;
    var rootPathname = settings.rootPathname(originalPathname);
    
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