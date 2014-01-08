var path = require('path');
var fs = require('fs');

module.exports =  function (settings, store, routes) {
  return function (req, res, next) {
    req.ss = req.ss || {};
    req.ss.settings = settings;
    req.ss.store = store;
    req.ss.cache = settings.client || {};
    req.ss.routes = routes;
    req.ss.pathname = parsePathname(req);
    
    req.ss.isHtml = function (pathname) {
      return path.extname(pathname) === '.html';
    };
    
    req.ss.rootPathname = function (pathname) {
      var root = req.ss.config.root || './';
      return path.join('/', root, pathname);
    };
    
    next();
  };
  
  function parsePathname (req) {
    return req.url.split('?')[0];
  }
};