var path = require('path');
var fs = require('fs');
var isUrl = require('is-url');
var DEFAULT_ERROR_PAGE = path.resolve(__dirname, '../../lib/templates/not_found.html');

var notFound = function (settings, store, errorPage) {
  return function (req, res, next) {
    res.statusCode = 404;
    res.send(getErrorPage(req.config, settings), true, 404);
    
    function getErrorPage (config, settings) {
      return (pathExists(config, settings))
        ? pathWithRoot(config, settings)
        : settings._defaults.error_page || DEFAULT_ERROR_PAGE;
    }

    function pathExists (config, settings) {
      if (!config || !config.error_page) return false;
      if (isUrl(config.error_page)) return true;
      
      // NOTE: If this becomes a bottleneck, convert 
      // to async version of fs.exists()
      return settings.isFile(config.error_page);
    }

    function pathWithRoot (config, settings) {
      if (isUrl(config.error_page)) return config.error_page;
      return store.getPath(path.join('/', req.config.cwd || '/', config.error_page));
    }
  };
  
};


module.exports = notFound;