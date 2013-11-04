var path = require('path');
var minimatch = require('minimatch');

var customRoute = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  if (!req.ss.config) return next();
  
  var router = internals.router = req.ssRouter;
  var config = req.ss.config;
  var customRoute
  
  if (!(customRoute = internals.isCustomRoute(req))) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(customRoute);
  req.superstatic.relativePath = path.join('/', customRoute);

  next();
};

var internals = {
  isCustomRoute: function (req) {
    var customRoute;
    var filePath = req.ss.pathname;// || req.url;
    var routes = req.ss.config.routes || {};
    
    filePath = path.join('/', filePath);
    
    Object.keys(routes).forEach(function (key) {
      var route = path.join('/', key);
      if (minimatch(filePath, route)) customRoute = routes[key];
    });
    
    return customRoute;
  }
};

customRoute.internals = internals;
module.exports = customRoute;