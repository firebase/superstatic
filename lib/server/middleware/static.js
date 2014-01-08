var path = require('path');

module.exports = function () {
  return function (req, res, next) {
    var indexFile = req.ss.config.index;
    
    var pathname = (isDirectoryIndex(req, req.ss.pathname))
      ? path.join(req.ss.rootPathname(req.ss.pathname), indexFile)
      : req.ss.pathname;
    
    if (!req.ss.settings.isFile(req.ss.rootPathname(pathname))) return next();
    
    res.send(pathname);
          
    function isDirectoryIndex (req, pathname) {
      return req.ss.settings.isFile(path.join(req.ss.rootPathname(pathname), indexFile))
    }
  };
};