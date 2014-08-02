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

var FAVICON_PATH = __dirname + '/templates/favicon.ico';
var DEFAULT_ERROR_PAGE = __dirname + '/templates/not_found.html';

module.exports = function stacker (app, options) {
  options = options || {};
  
  var settings = app.settings || {};
  var store = app.store || {};
  var cwd = settings.cwd || process.cwd();
  
  return function (req, res, next) {
    
    // TODO: convert configure middleware to just be a method here
    // TODO: only run these middlewares if "req.config" exists
    
    var stack = stacked();
    var config = req.config || {};
    var root = config.root || './';
    var cwdRoot = path.resolve(cwd, root);
    
    // TODO: need a way to pass in a default error page for things like DIO
    var errorPage = (config.error_page)
      ? path.join(cwdRoot, config.error_page)
      : DEFAULT_ERROR_PAGE;
    
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
    stack.use(slashify({
      root: cwdRoot,
      index: config.index,
      exists: (settings.isFile) ? settings.isFile.bind(settings) : undefined,
    }));
    
    stack.use(protect(settings));
    
    // Headers
    if (config.headers) stack.use(headers(config.headers));
    
    // Caching
    if (config.cache_control) stack.use(cache(config.cache_control));
    
    // Environment config values
    stack.use(env(settings, app.localEnv));
    
    // Clean Urls
    if (config.clean_urls && config.clean_urls !== 'false' /* TODO: test this */) {
      stack.use(cleanUrls({
        root: cwdRoot,
        index: config.index,
        exists: (config.files) ? settings.isFile.bind(settings) : undefined,
        fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined
      }));
    }
    
    // Serve static files
    stack.use(settle({
      root: cwdRoot,
      index: config.index,
      exists: (config.files) ? settings.isFile.bind(settings) : undefined,
      fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined
    }));
    
    // Custom routes
    if (config.routes) {
      stack.use(router(config.routes, {
        root: cwdRoot,
        index: config.index,
        exists: (settings && settings.isFile) ? settings.isFile.bind(settings) : null, // TODO: test this
        fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined
      }));
    }
    
    // Favicon
    stack.use(favicon(FAVICON_PATH));
    
    // Not found/error page
    stack.use(notFound(errorPage, {
      exists: (config.files) ? settings.isFile.bind(settings) : undefined,
      fullPath: (config.files) ? store.fullPath.bind(store, settings) : undefined,
      _default: DEFAULT_ERROR_PAGE
    }));
    
    if (options.testMode) return stack;
    
    stack(req, res, next);
  };
};