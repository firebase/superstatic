var path = require('path');
var join = path.join;
var url = require('url');

var static = function (settings, fileStore) {
  return function (req, res, next) {
    var indexFile = req.config.index;
    var originalPathname = url.parse(req.url).pathname;
    var rootPathname = settings.rootPathname(originalPathname);
    
    var pathname = (static.isDirectoryIndex(fileStore, rootPathname, indexFile))
      ? join(rootPathname, indexFile)
      : rootPathname;
    
    if (!fileStore.exists(pathname)) return next();
    
    res.send(pathname);
  };
};

static.isDirectoryIndex = function (fileStore, rootPathname, indexFile) {
  return fileStore.exists(join(rootPathname, indexFile));
};

module.exports = static;