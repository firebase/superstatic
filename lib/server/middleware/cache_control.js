var path = require('path');
var minimatch = require('minimatch');
var _ = require('lodash');
var slash = require('slasher');
var url = require('url');

module.exports = function () {
  return function (req, res, next) {
    var cacheMaxAges = (req.config && req.config.cache_control)
      ? req.config.cache_control
      : {};
    
    var pathname = url.parse(req.url).pathname;
    var matched = false;
    var _rel = slash(pathname);

    _.each(_.keys(cacheMaxAges), function (globKey) {
      var _glob = slash(globKey);
     
      if (minimatch(_rel, _glob) && !matched) {
        var val = cacheMaxAges[globKey];
        matched = true;
       
        if (val == false) res.setHeader('Cache-Control', 'no-cache');
        if (_.isNumber(val)) res.setHeader('Cache-Control', 'public, max-age=' + val.toString());
        if (_.isString(val)) res.setHeader('Cache-Control', val);
      }
    });

    if (!matched) res.setHeader('Cache-Control', 'public, max-age=300');
    
    next();
  };
};