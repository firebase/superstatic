var path = require('path');

var cleanUrls = function (req, res, next) {
  var router = internals.router = req.ssRouter;
  
  if (req.superstatic && req.superstatic.path) return next();
  var url = internals.isCleanUrl(req.url);
  
  if (router.cleanUrls && router.isHtml(req.url)) {
    var redirectUrl = path.join('/', path.dirname(req.url), path.basename(req.url, '.html'));
    
    res.writeHead(301, {Location: redirectUrl});
    return res.end();
  }
  
  if (!url) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path = router._buildFilePath(url);

  next();
};

var internals = {
  isCleanUrl: function (filePath) {
    var finalPath = false;
    var pathWithExt = filePath + '.html';
    var fullPath = internals.router._buildRelativePath(pathWithExt);
    
    if (internals.router.isFile(fullPath)) finalPath = pathWithExt;
    
    return finalPath;
  }
};

cleanUrls.internals = internals;
module.exports = cleanUrls;