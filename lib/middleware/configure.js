var path = require('path');
var fs = require('fs');
var url = require('fast-url-parser');
var _ = require('lodash');

// TODO: look into using parseurl module https://www.npmjs.org/package/parseurl

module.exports =  function (settings) {
  return function (req, res, next) {
    if (!req.headers.host) return next();
      
    settings.load(parseHostname(req), function (err, config) {
      if (err) return next();
      if (!config) config = {};
      
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