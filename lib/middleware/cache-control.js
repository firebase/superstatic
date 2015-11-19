'use strict';

var cacheControl = require('cache-control');

module.exports = function(spec, config) {
  return function(req, res, next) {
    if (config.cacheControl) {
      return cacheControl(config.cacheControl);
    }
    next();
  };
};
