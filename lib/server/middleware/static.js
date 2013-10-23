var path = require('path');
var minimatch = require('minimatch');

var static = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  if (!req.ss.config) return next();
  if (req.ss.config.config.clean_urls && router.isHtml(req.url)) return next();
  if(!internals.isStatic(req, router._buildRelativePath(req.url))) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(req.url);
  
  next();
};

var internals = {
  isStatic: function (req, filePath) {
    var file = false;
    
    if (req.ss.config.config.clean_urls && internals.router.isHtml(filePath)) {
      file = false;
    }
    else{
      if (internals.router.isFile(filePath)) {
        file = internals.router._buildFilePath(filePath);
      }
    }
    // TODO: Get rid of those nested if statemens ^^^^
    
    return file;
  }
};

static.internals = internals;
module.exports = static;