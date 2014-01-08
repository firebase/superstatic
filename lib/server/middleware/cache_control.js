var path = require('path');
var minimatch = require('minimatch');
var _ = require('lodash');

module.exports = function () {
  return function (req, res, next) {
    var cacheMaxAges = req.ss.config.cache_control || {};
    var matched = false;

    _.each(_.keys(cacheMaxAges), function (globKey) {
      var _rel = path.join('/', req.ss.pathname);
      var _glob = path.join('/', globKey);
     
      if (minimatch(_rel, _glob) && !matched) {
        var val = cacheMaxAges[globKey];
        matched = true;
       
        if (val == false) res.setHeader('Cache-Control', 'no-cache');
        if (_.isNumber(val)) res.setHeader('Cache-Control', 'public, max-age=' + val.toString());
        if (_.isString(val)) res.setHeader('Cache-Control', val);
      }
    });

    if (!matched) res.setHeader('Cache-Control', 'public, max-age=3600');
    
    next();
  };
};