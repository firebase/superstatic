var path = require('path');
var minimatch = require('minimatch');

var customRoute = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  var config = req.ss.config;
  
  if (!req.ss.config) return next();
  if (req.superstatic && req.superstatic.path) return next();
  
  var customRoute = internals.isCustomRoute(req);
  
  if (!customRoute) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(customRoute);

  next();
};

var internals = {
  isCustomRoute: function (req) {
    var customRoute;
    var filePath = req.url;
    var routes = req.ss.config.routes || [];
    
    filePath = path.join('/', filePath);
    
    Object.keys(routes).forEach(function (key) {
      var route = path.join('/', key);
      if (minimatch(filePath, route)) customRoute = routes[key];
    });
    
    return customRoute;
  },
  
  
};

customRoute.internals = internals;
module.exports = customRoute;