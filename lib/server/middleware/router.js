var path = require('path');

var ssRouter = function (settings, store) {
  return function (req, res, next) {
    req.ss = {};
    req.ss.settings = settings;
    req.ss.store = store;
    
    var router = req.ssRouter = {
      settings: settings,
      store: store,
      routes: settings.configuration.routes || {},
      cleanUrls: settings.configuration.clean_urls || false,
      files: settings.configuration.files || [],
      
      _buildFilePath: function (filePath) {
        return path.join(router.settings.cwd, router.settings.configuration.root, filePath || '');
      },
      
      _buildRelativePath: function (filePath) {
        return path.join('/', router.settings.configuration.root, filePath);
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