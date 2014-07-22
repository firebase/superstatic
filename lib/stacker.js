var path = require('path');
var middleware = require('./middleware');
var favicon = require('serve-favicon');
var url = require('fast-url-parser');
var stacked = require('stacked');
var redirects = require('redirects');
var router = require('static-router');
var cache = require('cache-control');
var cleanUrls = require('clean-urls');
var headers = require('set-headers');
var settle = require('settle');
var notFound = require('not-found');

module.exports = function stacker (app, options) {
  options = options || {};
  
  return function (req, res, next) {
    
    // TODO: convert configure middleware to just be a method here
    
    var pack = stacked();
    var config = req.config || {};
    var settings = app.settings || {};
    var cwd = settings.cwd || process.cwd();
    var root = config.root || './';
    
    pack.use(middleware.services(app.services, app.servicesRoutePrefix));
    
    if (config.redirects) pack.use(redirects(req.config.redirects));
    
    pack.use(middleware.removeTrailingSlash(settings));
    pack.use(middleware.protect(settings));
    
    if (config.headers) pack.use(headers(config.headers));
    
    // TODO: test that this middleware gets these arguments
    pack.use(middleware.sender(settings, app.store));
    
    if (config.cache_control) pack.use(cache(config.cache_control));
    
    pack.use(middleware.env(settings, app.localEnv));
    
    if (config.clean_urls && config.clean_urls !== 'false' /* TODO: test this */) {
      pack.use(cleanUrls({
        root: path.resolve(cwd, root)
      }));
    }
    
    // Serve static files
    pack.use(settle({
      root: path.resolve(cwd, root)
    }));
    
    if (config.routes) {
      pack.use(router(config.routes, {
        root: path.resolve(cwd, root),
        index: config.index,
        exists: (settings) ? settings.isFile : null
      }));
    }
    
    pack.use(favicon(__dirname + '/templates/favicon.ico'));
    
    
    /////////////////////////////////////////////////////////////
    
    // pack.use(middleware.notFound(settings, app.store));
    pack.use(notFound({
      file: __dirname + '/templates/not_found.html' // TODO: need to set this to work with DIO too (remote)
    }));
    // TODO: use this logic when passing in not found path
    
    // var DEFAULT_ERROR_PAGE = path.resolve(__dirname, '../../lib/templates/not_found.html');

    // res.statusCode = 404;
    // res.send(getErrorPage(req.config, settings), true, 404);

    // function getErrorPage (config, settings) {
    //   return (pathExists(config, settings))
    //     ? pathWithRoot(config, settings)
    //     : settings._defaults.error_page || DEFAULT_ERROR_PAGE;
    // }

    // function pathExists (config, settings) {
    //   if (!config || !config.error_page) return false;
    //   if (isUrl(config.error_page)) return true;
      
    //   // NOTE: If this becomes a bottleneck, convert 
    //   // to async version of fs.exists()
    //   return settings.isFile(join(config.root, config.error_page));
    // }

    // function pathWithRoot (config, settings) {
    //   if (isUrl(config.error_page)) return config.error_page;
    //   return store.getPath(settings, join(
    //     '/',
    //     req.config.cwd || '/',
    //     req.config.root || 
    //     '/',
    //     config.error_page
    //   ));
    // }
    // /////////////////////////////////////////////////////////////////////////////

    
    
    
    
    if (options.testMode) return pack;
    
    pack(req, res, next);
  };
};