var ssStatic = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  if (router.cleanUrls && router.isHtml(req.url)) return next();
  
  var static = internals.isStatic(router._buildRelativePath(req.url));
  
  if(!static) return next();
  req.superstatic = req.superstatic || {};
  req.superstatic.path =  router._buildFilePath(req.url);
  
  next();
};

var internals = {
  isStatic: function (filePath) {
    var file = false;
    
    if (internals.router.cleanUrls && internals.router.isHtml(filePath)) {
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

ssStatic.internals = internals;
module.exports = ssStatic;