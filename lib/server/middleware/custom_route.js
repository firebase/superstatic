var path = require('path');
var minimatch = require('minimatch');
var slash = require('slasher');
var globject = require('globject');

module.exports = function () {
  return function (req, res, next) {
    var pathname = req.ss.pathname;
    var routes = globject(slash(req.config.routes));
    var filePath = routes(slash(pathname));
    
    if (!filePath) return next();
    
    filePath = slash(req.rootPathname(filePath));
    filePath = directoryIndex(filePath, req.config.index);
    
    if (!req.settings.isFile(filePath)) return next();
    
    res.send(filePath);
  };
};

function directoryIndex (filePath, index) {
  // Serve the index file of a directory
  if (filePath && path.extname(filePath) !== '.html') {
    filePath = path.join(slash(filePath), index);
  }
  
  return filePath;
}