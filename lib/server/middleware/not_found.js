var path = require('path');
var fs = require('fs');
var isUrl = require('is-url');

var notFound = function (settings, store) {
  return function (req, res, next) {
    res.statusCode = 404;
    res.send(getErrorPage(req.config, settings), true);
  };
  
  function getErrorPage (config, settings) {
    return (pathExists(config, settings))
      ? pathWithRoot(config, settings)
      : path.resolve(__dirname, '../templates/not_found.html');
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
    // return settings.rootPathname(config.error_page);
    console.log(store.getPath(config.error_page));
    return store.getPath(config.error_page);
  }
};


module.exports = notFound;