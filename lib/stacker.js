var path = require('path');
var stacked = require('stacked');
var _ = require('lodash');

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

var FAVICON_PATH = __dirname + '/templates/favicon.ico';
var DEFAULT_ERROR_PAGE = __dirname + '/templates/not_found.html';

module.exports = function stacker (app, options) {
  options = options || {};
  
  var settings = app.settings || {};
  var store = app.store || {}; // TODO: this should go in settings
  var cwd = settings.cwd || process.cwd();
  
  return function (req, res, next) {
    
    // TODO: convert configure middleware to just be a method here
    // TODO: only run these middlewares if "req.config" exists
    
    var stack = stacked();
    var config = req.config || {};
    var root = config.root || './';
    var cwdRoot = path.resolve(cwd, root);
    var middlewareOptions = {
      root: cwdRoot,
      index: config.index,
      exists: (settings && config.files) ? settings.isFile.bind(settings) : undefined,
      fullPath: (settings && config.files) ? store.fullPath.bind(store, settings) : undefined
    };
    
    // Services
    stack.use(services({
      services: app.services,
      prefix: app.servicesRoutePrefix,
      config: req.config,
      track: app.track && app.track.indexOf('services') > -1 // TODO: test this
    }));
    
    // Redirects
    if (config.redirects) stack.use(redirects(req.config.redirects));
    
    // Remove trailing slash
    stack.use(slashify(middlewareOptions));
    
    // Basic auth
    stack.use(protect(settings));
    
    // Headers
    if (config.headers) stack.use(headers(config.headers));
    
    // Caching
    if (config.cache_control) stack.use(cache(config.cache_control));
    
    // Environment config values
    stack.use(env(settings, app.localEnv));
    
    // TODO: make this work
    // stack.use(status(config))
    
    // Clean Urls
    if (config.clean_urls && config.clean_urls !== 'false' /* TODO: test this */) stack.use(cleanUrls(middlewareOptions));
    
    // Serve static files
    stack.use(settle(middlewareOptions));
    
    // Custom routes
    if (config.routes) stack.use(router(config.routes, middlewareOptions));
    
    // Favicon
    stack.use(favicon(FAVICON_PATH));
    
    // Not found/error page
    stack.use(notFound(errorPagePath(), _.extend(middlewareOptions, {_default: DEFAULT_ERROR_PAGE})));

    // Test mode
    if (options.testMode) return stack;
    
    // Run the stack
    stack(req, res, next);
    
    req.log.info('TEST: ' + req.config.name + ' error page path: ' + errorPagePath());
    
    // TODO: need a way to pass in a default error page for things like DIO
    function errorPagePath() {
      var p;
      
      if (config.error_page) {
        p = path.join(cwdRoot, config.error_page);
      }
      else if (settings._defaults && settings._defaults.error_page) {
        p = settings._defaults.error_page;
      }
      else {
        p = DEFAULT_ERROR_PAGE;
      }
      
      return p;
    }
  };
};