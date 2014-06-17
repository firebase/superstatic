var path = require('path');
var minimatch = require('minimatch');
var slash = require('slasher');
var globject = require('globject');
var url = require('url');

module.exports = function (settings) {
  return function (req, res, next) {
    if (!req.config) return next();
    
    var pathname = url.parse(req.url).pathname;
    var headersConfig = globject(slash(req.config.headers));
    var headers = headersConfig(slash(pathname)) || {};
    var key;

    for (key in headers) {
      res.setHeader(key, headers[key]);
    }
    
    return next();
  };
};
