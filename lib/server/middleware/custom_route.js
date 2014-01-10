var path = require('path');
var minimatch = require('minimatch');
var _ = require('lodash');
var slash = require('normalize-pathname');

module.exports = function () {
  return function (req, res, next) {
    var pathname = req.ss.pathname;
    var filePath = req.config.routes[_.find(
      _.keys(req.config.routes),
      function (route) {
        return minimatch(slash(pathname), slash(route));
      }
    )];
    
    if (!filePath) return next();
    
    // Serve the index file of a directory
    if (filePath && path.extname(filePath) !== '.html') {
      filePath = path.join(slash(filePath), req.config.index);
    }
    
    // Is this a file?
    if (!req.settings.isFile(req.rootPathname(filePath))) return next();
    
    res.send(slash(filePath));
  };
};