var path = require('path');
var fs = require('fs');
var url = require('url');
var _ = require('lodash');

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
    
    req.workingPathname = function (pathname) {
      return path.join('/', req.config.cwd, pathname || '');
    };
    
    req.settings.load(parseHostname(req), function (err, config) {
      if (err) return next();
      
      req.config = config || {config: {}};
      req.config.index = config.index || 'index.html';
      
      // // Why aren't these stored in the cache?
      // // FIXME: these cause the tests to fail
      _.extend(req.config, req.config.config);
      
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