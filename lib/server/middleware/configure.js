var path = require('path');
var fs = require('fs');
var url = require('url');
var _ = require('lodash');

module.exports =  function (settings) {
  return function (req, res, next) {
    settings.load(parseHostname(req), function (err, config) {
      if (err) return next();
      
      req.config = config || {config: {}};
      req.config.index = config.index || 'index.html';
      
      // // Why aren't these stored in the cache?
      // // FIXME: these cause the tests to fail
      _.extend(req.config, req.config.config);
      
      next();
    });
  };
  
  function parseHostname (req) {
    var protocol = (req.connection.encrypted) ? 'https://' : 'http://';
    var urlObj = url.parse(protocol + req.headers.host);
    return urlObj.hostname;
  };
};