var qs = require('qs');
var url = require('fast-url-parser');
var join = require('join-path');
var query = require('connect-query');

module.exports = function (imports) {
  
  var provider = imports.provider;
  
  return function (req, res, next) {
    
    var pathname = url.parse(req.url).pathname;
    
    query()(req, res, function (err) {
      
      
      if (err) {
        return next(err);
      }
      
      // Handle directories with no default index file
      if (isDirectory() && !isDirectoryIndex()) {
        return next();
      }
      
      // Add a slash to a path that represtents a directory index
      if (isDirectoryIndex() && !hasTrailingSlash()) {
        return redirect(join(pathname, '/')); // Don't remove tailing slash on directory index file
      }
      
      // Skip if this is a directory index path
      if (isDirectoryIndex()) {
        return next();
      }
      
      // Handle paths that don't need a strailing slash
      if (pathname !== '/' && hasTrailingSlash()) {
        return redirect(pathname.substring(0, pathname.length - 1));
      }

      // No redirect needed
      next();
    });
    
    function redirect (redirectUrl) {
      
      var query = qs.stringify(req.query);
      redirectUrl += (query) ? '?' + query : '';
      res.__.redirect(redirectUrl);
    }
    
    function isDirectory () {
      
      return provider.existsSync(req.url) && provider.isDirectorySync(req.url);
    }
    
    function isDirectoryIndex () {
      
      return provider.isDirectoryIndexSync(req.url);
    }
    
    function hasTrailingSlash () {
      
      return pathname.substr(-1) === '/';
    }
  };
};