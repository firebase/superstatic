var _ = require('lodash');
var globject = require('globject');
var slash = require('slasher');
var pathToRegexp = require('path-to-regexp');
var reverend = require('reverend');

module.exports = function () {
  return function (req, res, next) {
    if (!req.config || !req.config.redirects) return next();
    
    var statusCode = 301;
    var normalizedRedirects = slash(req.config.redirects);
    var redirects = globject(normalizedRedirects);
    var redirectUrl = redirects(req.url);
    var redirectObj;
    
    // redirect with segments
    if (!redirectUrl) redirectUrl = parseUrlFromSegments(req.url, normalizedRedirects);
    
    // redrect from config object
    if (_.isObject(redirectUrl)) {
      redirectObj = redirectUrl;
      redirectUrl = redirectObj.url;
      statusCode = redirectObj.status || statusCode;
    }
    
    if (!redirectUrl) return next();
    
    res.writeHead(statusCode, {Location: redirectUrl});
    res.end();
  };
};

function parseUrlFromSegments (url, normalizedRedirects) {
  var redirectTo =
    _(normalizedRedirects)
      .map(parseSegements(url))
      .filter(_.identity)
      .first();
  
  if (redirectTo) return reverend.apply(reverend, redirectTo);
}

function parseSegements (url) {
  return function (pathWithSegments, key) {
    var keys = [];
    var exp = pathToRegexp(key, keys);
    var matches = url.match(exp);
    
    if (!matches) return;
    
    var segmentNames = _.pluck(keys, 'name');
    var segmentValues = matches.slice(1);
    return [pathWithSegments, _.zipObject(segmentNames, segmentValues)];
  };
}

function prefix (str) {
  return function (val) {
    return str + val;
  };
}