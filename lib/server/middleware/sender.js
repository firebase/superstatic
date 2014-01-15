var path = require('path');
var deliver = require('deliver');

module.exports = function () {
  return function (req, res, next) {
    res.send = function (pathname) {
      req.url = pathname;
      return deliver(req, {root: req.config.cwd}).pipe(res);
    }
    
    next();
  };
};