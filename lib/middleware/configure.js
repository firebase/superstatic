var path = require('path');
var fs = require('fs');

var url = require('fast-url-parser');
var _ = require('lodash');

module.exports =  function (settings) {
  return function (req, res, next) {
    if (!req.headers.host) return next();
      
    settings.load(parseHostname(req), function (err, config) {
      
      // App not found
      if (err && err.message === 'NOT_FOUND') {
        return next();
      }
      
      // Handle disabled app
      if (err && err.message && typeof settings.handleDisabledApp === 'function') {
        settings.handleDisabledApp(req, res, err.message);
      }
      
      // Any other errors
      if (err) {
        return next();
      }
      
      if (!config) {
        config = {};
      }
      
      req.config = config || {config: {}};
      req.config.index = config.index || 'index.html';
      
      // Why aren't these stored in the cache?
      // TODO: these have no affect on the tests.
      // do we still need this?
      _.extend(req.config, req.config.config);
      
      if (!req.config) req.config = {};
      
      next();
    });
  };
  
  function parseHostname (req) {
    var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
    var urlObj = url.parse(protocol + req.headers.host);
    return urlObj.hostname;
  }
};