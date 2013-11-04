var path = require('path');
var qs = require('querystring');

var cleanUrls = function (req, res, next) {
  if (req.superstatic && req.superstatic.path) return next();
  if (!req.ss.config) return next();
  
  var router = internals.router = req.ssRouter;
  var cleanUrls = req.ss.config.config.clean_urls;
  var url;
  
  if (!cleanUrls) return next();
  if (cleanUrls && router.isHtml(req.ss.pathname)) return internals.redirect(req, res);
  if (!(url = internals.isCleanUrl(req.ss.pathname))) return next();
  
  req.superstatic = req.superstatic || {};
  req.superstatic.path = router._buildFilePath(url);
  req.superstatic.relativePath = url;
  
  next();
};

var internals = {
  isCleanUrl: function (filePath) {
    var finalPath = false;
    var pathWithExt = filePath + '.html';
    var fullPath = internals.router._buildRelativePath(pathWithExt);
    if (internals.router.isFile(fullPath)) finalPath = pathWithExt;
    
    return finalPath;
  },
  
  redirect: function (req, res) {
    var redirectUrl = path.join('/', path.dirname(req.ss.pathname), path.basename(req.ss.pathname, '.html'));
    
    var query = qs.stringify(req.query);
    redirectUrl += (query) ? '?' + query : '';
    
    res.writeHead(301, {Location: redirectUrl});
    res.end();
  }
};

cleanUrls.internals = internals;
module.exports = cleanUrls;