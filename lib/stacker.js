var path = require('path');
var url = require('fast-url-parser');
var stacked = require('stacked');

// Middleware
var favicon = require('serve-favicon');
var redirects = require('redirects');
var router = require('static-router');
var cache = require('cache-control');
var cleanUrls = require('clean-urls');
var headers = require('set-headers');
var settle = require('settle');
var notFound = require('not-found');
var slashify = require('slashify');
var services = require('./middleware/services');
var protect = require('./middleware/protect');
var env = require('./middleware/env');

module.exports = function stacker (app, options) {
  options = options || {};
  
  return function (req, res, next) {
    
    // TODO: convert configure middleware to just be a method here
    // TODO: only run these middlewares if "req.config" exists
    
    var pack = stacked();
    var config = req.config || {};
    var settings = app.settings || {};
    var store = app.store || {};
    var cwd = settings.cwd || process.cwd();
    var root = config.root || './';
    var cwdRoot = path.resolve(cwd, root);
    var FAVICON_PATH = __dirname + '/templates/favicon.ico';
    
    // TODO: need a way to pass in a default error page for things like DIO
    var DEFAULT_ERROR_PAGE = __dirname + '/templates/not_found.html';
    var errorPage = (config.error_page)
      ? path.join(cwd, root, config.error_page)
      : DEFAULT_ERROR_PAGE;
    
    // // Services
    // pack.use(services({
    //   services: app.services,
    //   prefix: app.servicesRoutePrefix,
    //   config: req.config,
    //   track: app.track && app.track.indexOf('services') > -1 // TODO: test this
    // }));
    
    // if (config.redirects) pack.use(redirects(req.config.redirects));
    
    // Remove trailing slahs
    // pack.use(slashify({
    //   root: cwdRoot,
    //   index: config.index
    // }));
    
    pack.use(protect(settings));
    
    // if (config.headers) pack.use(headers(config.headers));
    
    // if (config.cache_control) pack.use(cache(config.cache_control));
    
    pack.use(env(settings, app.localEnv));
    
    // if (config.clean_urls && config.clean_urls !== 'false' /* TODO: test this */) {
    //   pack.use(cleanUrls({
    //     root: path.resolve(cwd, root)
    //   }));
    // }
    
    // Serve static files
    pack.use(settle({
      root: cwdRoot,
      exists: (config.files) ? settings.isFile.bind(settings) : undefined,
      fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined
    }));
    
    // Custom routes
    // if (config.routes) {
    //   pack.use(router(config.routes, {
    //     root: cwdRoot,
    //     index: config.index,
    //     exists: (settings && settings.isFile) ? settings.isFile.bind(settings) : null // TODO: test this
    //   }));
    // }
    
    // pack.use(favicon(FAVICON_PATH));

    
    /////////////////////////////////////////////////////////////
    
    
    // TODO: test this
    pack.use(notFound(errorPage, {
      exists: (config.files) ? settings.isFile.bind(settings) : undefined,
      fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined
    }));
    
    // pack.use(middleware.notFound(settings, app.store));
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