var path = require('path');
var minimatch = require('minimatch');
var slash = require('slasher');
var globject = require('globject');
var url = require('url');

module.exports = function (settings, fileStore) {
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    var routes = globject(slash(req.config.routes));
    var filePath = routes(slash(pathname));
    
    if (!filePath) return next();
    
    filePath = slash(settings.rootPathname(filePath));
    filePath = directoryIndex(filePath, req.config.index);
    
    if (!settings.isFile(filePath)) return next();
    
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