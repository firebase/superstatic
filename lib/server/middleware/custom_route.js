var path = require('path');
var minimatch = require('minimatch');
var _ = require('lodash');

module.exports = function () {
  return function (req, res, next) {
    var pathname = req.ss.pathname;
    var filePath = req.ss.config.routes[_.find(
      _.keys(req.ss.config.routes),
      function (route) {
        return minimatch(path.join('/', pathname), path.join('/', route));
      }
    )];
    
    if (!filePath) return next();
    
    // Is this a directory?
    // If it is, server the index file
    if (filePath && path.extname(filePath) !== '.html') {
      filePath = path.join(filePath, req.ss.config.index);
    }
    
    // Is this a file?
    if (!req.ss.settings.isFile(req.ss.rootPathname(filePath))) return next();
    
    res.send(filePath);
  };
};