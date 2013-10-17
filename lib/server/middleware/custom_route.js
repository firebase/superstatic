var path = require('path');
var minimatch = require('minimatch');

var customRoute = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  if (req.superstatic && req.superstatic.path) return next();
  
  var customRoute = internals.isCustomRoute(req.url);
  
  if (!customRoute) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(customRoute);
  
  next();
};

var internals = {
  isCustomRoute: function (filePath) {
    var customRoute;
    
    filePath = path.join('/', filePath);
    
    Object.keys(internals.router.routes).forEach(function (key) {
      var route = path.join('/', key);
      if (minimatch(filePath, route)) customRoute = internals.router.routes[key];
    });
    
    return customRoute;
  }
};

customRoute.internals = internals;
module.exports = customRoute;