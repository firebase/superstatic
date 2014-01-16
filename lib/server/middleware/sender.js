var path = require('path');
var deliver = require('deliver');

module.exports = function () {
  return function (req, res, next) {
    res.send = function (pathname) {
      req.url = req.ss.store.getPath(req.workingPathname(pathname));
      return deliver(req).pipe(res);
    };
    
    next();
  };
};