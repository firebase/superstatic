var path = require('path');
var deliver = require('deliver');
var mime = require('mime-types');
var url = require('fast-url-parser');

module.exports = function (settings, fileStore) {
  return function (req, res, next) {
    res.send = function (pathname, isNotRelative, statusCode) {
      var cwd = (req.config && req.config.cwd) ? req.config.cwd : '/';
      pathname = pathname || '';
      
      req.url = (isNotRelative)
        ? pathname
        : fileStore.getPath(settings, path.join('/', cwd, pathname));
      
      return deliver(req, {
        statusCode: statusCode,
        contentType: mime.lookup(pathname)
      }).pipe(res);
    };
    
    next();
  };
};