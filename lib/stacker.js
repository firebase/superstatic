var path = require('path');
var middleware = require('./middleware');
var favicon = require('serve-favicon');
var url = require('fast-url-parser');
var stacked = require('stacked');
var redirects = require('redirects');
var router = require('static-router');
var cache = require('cache-control');
var cleanUrls = require('clean-urls');

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
    
    if (config.headers) pack.use(middleware.headers(settings));
    
    // TODO: test that this middleware gets these arguments
    pack.use(middleware.sender(settings, app.store));
    
    if (config.cache_control) pack.use(cache(config.cache_control));
    
    pack.use(middleware.env(settings, app.localEnv));
    
    if (config.clean_urls && config.clean_urls !== 'false' /* TODO: test this */) pack.use(cleanUrls({
      root: path.resolve(cwd, root)
    }));
    
    pack.use(middleware.static(settings));
    
    if (config.routes) {
      pack.use(router(config.routes, {
        root: path.resolve(cwd, root),
        index: config.index,
        exists: (settings) ? settings.isFile : null
      }));
    }
    
    pack.use(favicon(__dirname + '/templates/favicon.ico'));
    pack.use(middleware.notFound(settings, app.store));
    
    if (options.testMode) return pack;
    
    pack(req, res, next);
  };
};