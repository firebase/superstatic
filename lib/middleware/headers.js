var path = require('path');
var slash = require('slasher');
var globject = require('globject');
var url = require('url');
var _ = require('lodash');

module.exports = function (settings) {
  return function (req, res, next) {
    if (!req.config) return next();
    
    var pathname = url.parse(req.url).pathname;
    var headersConfig = globject(slash(req.config.headers));
    var headers = headersConfig(slash(pathname)) || {};
    
    _.each(headers, function (val, name) {
      res.setHeader(name, val);
    });
    
    return next();
  };
};
