var path = require('path');
var deliver = require('deliver');
var mime = require('mime-types');
var url = require('fast-url-parser');
var _ = require('lodash');

module.exports = function (settings, fileStore) {
  return function (req, res, next) {
    res.send = function (pathname, isNotRelative, statusCode) {
      var filename;
      var cwd = (req.config && req.config.cwd) ? req.config.cwd : '/';
      pathname = pathname || '';
      
      if (req.config && req.config.file_map) {
        var filenameHash = _.last(pathname.split('?')[0].split('/'));
        filename = _.findKey(req.config.file_map, function (hash) {
          return hash === filenameHash;
        });
      }
      
      req.url = (isNotRelative)
        ? pathname
        : fileStore.getPath(settings, path.join('/', cwd, pathname));
      
      return deliver(req, {
        statusCode: statusCode,
        contentType: mime.lookup(filename || pathname)
      }).pipe(res);
    };
    
    next();
  };
};