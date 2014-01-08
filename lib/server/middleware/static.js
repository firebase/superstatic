var path = require('path');
var minimatch = require('minimatch');
var send = require('send');

var static = function (req, res, next) {
  // var router = internals.router = req.ssRouter;
  // var pathname = req.ss.pathname;
  
  // if (!req.ss.config) return next();
  
  // function error(err) {
  //   console.log(err.message, err.stack);
  //   next();
  // }

  // return send(req, pathname)
  //   .root(router._buildRelativePath(pathname))
  //   .on('error', error)
  //   .pipe(res);
  
  
  
  var router = internals.router = req.ssRouter;
  var url = req.ss.pathname;
  
  if (!req.ss.config) return next();
  if (req.ss.config.config.clean_urls && router.isHtml(url)) return next();
  if(!internals.isStatic(req, router._buildRelativePath(url))) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(url);
  req.superstatic.relativePath = url;
  
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
    
    return file;
  }
};

static.internals = internals;
module.exports = static;