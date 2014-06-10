var feedback = require('feedback');

module.exports = function (debug, loggerFns) {
  return function (req, res, next) {
    if (req.log) return next();
    
    var log = loggerFns || feedback;
    
    req.log = {
      info: function (msg) {
        if (debug) log.info(msg);
        return this;
      },
      warn: function (msg) {
        if (debug)  log.warn(msg);
        return this;
      },
      error: function (msg) {
        if (debug) log.error(msg);
        return this;
      }
    };
    
    next();
  };
};