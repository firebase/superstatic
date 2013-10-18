var path = require('path');
var minimatch = require('minimatch');

var customRoute = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  // Handling custom routes
  if (req.headers && req.headers.referer) {
    var url = internals.resolveRelativePath(req);
    
    if (url !== req.url) {
      res.writeHead(301, {Location: url});
      return res.end();
    }
  } 
  
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
  },
  
  resolveRelativePath: function (req) {
    var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
    var splitUrl = req.url.split(path.sep);
    var splitRef = req.headers.referer
      .replace(req.headers.host, '')
      .replace(protocol, '')
      .split(path.sep);
    
    splitUrl.splice(0, 1);
    splitRef.splice(0, 1);
    
    var unPrefixedUrl = path.join('/', unPrefixUnion(splitUrl, splitRef).join(path.sep));
    
    return unPrefixedUrl;
  }
};

customRoute.internals = internals;
module.exports = customRoute;

function unPrefixUnion (arr1, arr2) {
  var placeholder = '..|..';
  
  // Set up array with placeholder
  var rebuiltUrl = arr2.map(function (ref, i) {
    return (arr1[i] !== ref) ? arr1[i] : placeholder;
  });
  
  // Parse absolute url through placeholder
  var finalUrl = arr1.filter(function (url, i) {
    if (rebuiltUrl[i] !== placeholder) return url;
  });
  
  return finalUrl;
}