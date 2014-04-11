var qs = require('querystring');
var url = require('url');
var join = require('path').join;

var removeTrailingSlash = function (settings) {
  return function (req, res, next) {
    var pathname = url.parse(req.url).pathname;
    
    // Don't remove tailing slash on directory index file
    if (isDirectoryIndex() && !hasTrailingSlash()) return redirect(join(pathname, '/'));
    if (isDirectoryIndex()) return next();
    if (pathname !== '/' && hasTrailingSlash()) return redirect(pathname.substring(0, pathname.length - 1));
    
    // pathname looks ok
    next();
    
    function redirect (redirectUrl) {
      var query = qs.stringify(req.query);
      
      redirectUrl += (query) ? '?' + query : '';
      res.writeHead(301, {Location: redirectUrl});
      res.end();  
    }
    
    function isDirectoryIndex () {
      var rootPathname = settings.rootPathname(pathname);
      return settings.isFile(join(rootPathname, req.config.index));
    }
    
    function hasTrailingSlash () {
      return pathname.substr(-1) === '/';
    }
  };
};


module.exports = removeTrailingSlash;