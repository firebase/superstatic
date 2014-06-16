var path = require('path');
var deliver = require('deliver');
var mime = require('mime');
var url = require('url');

module.exports = function (fileStore) {
  return function (req, res, next) {
    res.send = function (pathname, isNotRelative, statusCode) {
      var cwd = (req.config && req.config.cwd) ? req.config.cwd : '/';
      pathname = pathname || '';
      
      req.url = (isNotRelative)
        ? pathname
        : fileStore.getPath(path.join('/', cwd, pathname));
      
      return deliver(req, {
        statusCode: statusCode,
        contentType: mime.lookup(url.parse(req.url).pathname)
      }).pipe(res);
    };
    
    next();
  };
};