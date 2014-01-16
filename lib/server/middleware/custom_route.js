var path = require('path');
var minimatch = require('minimatch');
var slash = require('slasher');
var globject = require('globject');

module.exports = function () {
  return function (req, res, next) {
    var pathname = req.ss.pathname;
    var routes = globject(addLeadingSlash(req.config.routes));
    var filePath = routes(slash(pathname));
    
    // TODO: add a second param to globject
    // that is a mutator function
    // function (glob, val) {
    //  return ??????
    // }
    
    if (!filePath) return next();
    
    filePath = directoryIndex(filePath, req.config.index);
    
    // Is this a file?
    if (!req.settings.isFile(req.rootPathname(filePath))) return next();
    
    res.send(slash(filePath));
  };
};

// TODO: add to the slasher module to add slashes to 
// objects (keys and values)
// slasher(obj, {
//  key: true,
//  value true
// });

function addLeadingSlash (_routes) {
  var routes = {};
  
  Object.keys(_routes).forEach(function (key) {
    return routes[slash(key)] = slash(_routes[key]);
  });
  
  return routes;
}

function directoryIndex (filePath, index) {
  // Serve the index file of a directory
  if (filePath && path.extname(filePath) !== '.html') {
    filePath = path.join(slash(filePath), index);
  }
  
  return filePath;
}