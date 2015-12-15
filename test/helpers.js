'use strict';

module.exports = {
  decorator: function(middleware) {
    return function(config, spec) {
      return function(req, res, next) {
        req.superstatic = config || {};
        return middleware(spec || {})(req, res, next);
      };
    };
  }
};
