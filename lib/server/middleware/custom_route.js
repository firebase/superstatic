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
    
    res.send(filePath);
  };
};