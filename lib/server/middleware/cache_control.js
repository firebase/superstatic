var path = require('path');
var minimatch = require('minimatch');

module.exports = function () {
  return function (req, res, next) {
    var cacheMaxAges = req.ss.config.max_age || {};
    var relativeRequestPath = req.superstatic.relativePath;
    
    Object.keys(cacheMaxAges).forEach(function (globKey) {
      var _rel = path.join('/', relativeRequestPath);
      var _glob = path.join('/', globKey);
      
      if (minimatch(_rel, _glob)) {
        res.setHeader('Cache-Control', 'max-age=' + cacheMaxAges[globKey]);
      }
    });
    
    next();
  };
};