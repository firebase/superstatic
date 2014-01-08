var path = require('path');
var fs = require('fs');

module.exports =  function (settings, store, routes) {
  return function (req, res, next) {
    req.ss = req.ss || {};
    req.ss.settings = settings;
    req.ss.store = store;
    req.ss.cache = settings.client || {};
    req.ss.routes = routes;
    req.ss.pathname = _parsePathname(req);
    
    req.ssRouter = {
      _buildFilePath: function (filePath) {
        return path.join('/', req.ss.config.cwd, req.ss.config.root, filePath || '');
      },
      
      _buildRelativePath: function (filePath) {
        req.ss.config.root = req.ss.config.root || './';
        return path.join('/', req.ss.config.root, filePath);
      },
      
      isFile: function (filePath) {
        return req.ss.settings.isFile(filePath);
      },
      
      isHtml: function (filePath) {
        return path.extname(filePath) === '.html';
      },
    };
    
    
    req.ss.isHtml = function (filePath) {
      return path.extname(filePath) === '.html';
    };
    
    next();
    
  };
  
  function _parsePathname (req) {
    return req.url.split('?')[0];
  }
};