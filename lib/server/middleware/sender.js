var path = require('path');
var deliver = require('deliver');
var mime = require('mime');
var url = require('url');

module.exports = function (fileStore) {
  return function (req, res, next) {
    res.send = function (pathname, isNotRelative, statusCode) {
      req.url = (isNotRelative)
        ? pathname
        : fileStore.getPath(path.join('/', req.config.cwd, pathname || ''));
      
      return deliver(req, {
        statusCode: statusCode,
        contentType: mime.lookup(url.parse(req.url).pathname)
      }).pipe(res);
    };
    
    next();
  };
};