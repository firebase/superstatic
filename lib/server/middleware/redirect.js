var globject = require('globject');
var slash = require('slasher');
var _ = require('lodash');

module.exports = function () {
  return function (req, res, next) {
    if (!req.config || !req.config.redirects) return next();
    
    var statusCode = 301;
    var redirects = globject(slash(req.config.redirects));
    var redirectUrl = redirects(req.url);
    
    if (!redirectUrl) return next();
    
    // Custom redirect status code
    if (_.isObject(redirectUrl)) {
      var redirectObj = redirectUrl;
      redirectUrl = redirectObj.url;
      statusCode = redirectObj.statusCode;
    }
    
    res.writeHead(statusCode, {Location: redirectUrl});
    res.end();
  };
};