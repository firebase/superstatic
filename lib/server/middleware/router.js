var path = require('path');

var ssRouter = function (settings, store) {
  return function (req, res, next) {
    req.ss = {};
    req.ss.settings = settings;
    req.ss.store = store;
    
    var router = req.ssRouter = {
      _buildFilePath: function (filePath) {
        return path.join('/', req.ss.config.cwd, req.ss.config.root, filePath || '');
      },
      
      _buildRelativePath: function (filePath) {
        return path.join('/', req.ss.config.root, filePath);
      },
      
      isFile: function (filePath) {
        return req.ss.config.files.indexOf(filePath) > -1;
      },
      
      isHtml: function (filePath) {
        return path.extname(filePath) === '.html';
      },
    };
    
    next();
  };
};

module.exports = ssRouter;