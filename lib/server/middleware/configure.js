var path = require('path');
var fs = require('fs');
var url = require('url');

module.exports =  function (ctx) {
  return function (req, res, next) {
    req.ss = req.ss || {};
    req.settings = ctx.settings;
    req.ss.store = ctx.store;
    req.ss.cache = req.settings.client || {};
    req.ss.routes = ctx.routes;
    req.ss.pathname = parsePathname(req);
    
    req.rootPathname = function (pathname) {
      var root = req.config.root || './';
      return path.join('/', root, pathname);
    };
    
    req.settings.load(parseHostname(req), function (err, config) {
      if (err) return next();
      
      req.config = config || {};
      req.config.index = config.index || 'index.html';
      
      next();
    });
  };
  
  function parsePathname (req) {
    return req.url.split('?')[0];
  }
  
  function parseHostname (req) {
    var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
    var urlObj = url.parse(protocol + req.headers.host);
    return urlObj.hostname;
  };
};