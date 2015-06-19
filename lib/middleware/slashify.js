var qs = require('qs');
var url = require('fast-url-parser');
var join = require('join-path');
var query = require('connect-query');

module.exports = function (imports) {
  
  var provider = imports.provider;
  var config = imports.config || {};
  
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
      
      // Force trailing slash
      if (config.trailing_slash === true && !hasTrailingSlash() && !fileExists()) {
        return redirectWithSlash(pathname);
      }
      
      if (config.trailing_slash === false && hasTrailingSlash()) {
        return redirectWithoutSlash(pathname);
      }
      
      // Add a slash to a path that represtents a directory index
      if (isDirectoryIndex() && !hasTrailingSlash()) {
        return redirectWithSlash(pathname);
      }
      
      // Skip if this is a directory index path
      if (isDirectoryIndex()) {
        return next();
      }
      
      // Handle paths that don't need a strailing slash
      if (pathname !== '/' && hasTrailingSlash()) {
        return redirectWithoutSlash(pathname);
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
      
      return fileExists() && provider.isDirectorySync(urlNoQuery());
    }
    
    function fileExists () {
      
      return provider.existsSync(urlNoQuery());
    }
    
    function isDirectoryIndex () {
      
      return provider.isDirectoryIndexSync(urlNoQuery());
    }
    
    function hasTrailingSlash () {
      
      return pathname.substr(-1) === '/';
    }
    
    function urlNoQuery () {
      
      return req.url.split('?')[0];
    }
    
    function redirectWithoutSlash (pathanme) {
      
      return redirect(pathname.substring(0, pathname.length - 1));
    }
    
    function redirectWithSlash (pathname) {
      
      return redirect(join(pathname, '/'));
    }
  };
};