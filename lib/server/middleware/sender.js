var path = require('path');
var deliver = require('deliver');
var mime = require('mime');

module.exports = function () {
  return function (req, res, next) {
    res.send = function (pathname, isNotRelative) {
      req.url = (isNotRelative)
        ? pathname
        : req.ss.store.getPath(req.workingPathname(pathname));
      
      // S3 content types aren't set,
      // so they need to be set
      res.on('header', function () {
        res.setHeader('content-type', mime.lookup(req.url.split('?')[0]));
      });
      
      return deliver(req).pipe(res);
    };
    
    next();
  };
};