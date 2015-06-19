var _ = require('lodash');
var Router = require('router');
var send = require('send');
var basicAuth = require('basic-auth-connect');
var redirects = require('redirects');
var setHeaders = require('set-headers');
var cacheControl = require('cache-control');
var favicon = require('serve-favicon');
var jfig = require('jfig');

var dfs = require('./dfs');
var responder = require('./responder');
var middleware = require('./middleware');
var loadConfigFile = require('./loaders/config-file');

var FAVICON_PATH = __dirname + '/assets/favicon.ico';
var INDEX_FILE = 'index.html';
var CWD = process.cwd();
var ENV = '.env.json';

module.exports = function (spec) {
  
  spec = spec || {};
  var router = Router();
  var cwd = spec.cwd || CWD;
  
  // Load data
  var config = spec.config = loadConfigFile(spec.config);
  var env = jfig(spec.env || ENV, {
    root: process.cwd()
  });
  
  // Set up provider
  var provider = spec.provider || dfs(_.extend({
    index: INDEX_FILE, // default index file
    cwd: cwd // default current working directory
  }, config));
  
  
  // Setup helpers
  router.use(function (req, res, next) {
    
    responder({
      req: req,
      res: res,
      provider: provider
    });
    
    next();
  });
  
  // Protect
  if (spec.protect) {
    router.use(basicAuth.apply(basicAuth, spec.protect.split(':')));
  }
  
  // Services
  if (spec.services) {
    router.use(middleware.services(spec));
  }
  
  // Redirects
  if (config.redirects) {
    router.use(redirects(config.redirects));
  }
  
  // Headers
  if (config.headers) {
    router.use(setHeaders(config.headers));
  }
  
  // Remove trailing slash
  router.use(middleware.slashify({
    config: config,
    provider: provider
  }));
  
  // Cache control
  if (config.cache_control) {
    router.use(cacheControl(config.cache_control));
  }
  
  // Clean urls
  if (config.clean_urls) {
    router.use(middleware.cleanUrls({
      rules: config.clean_urls,
      config: config,
      provider: provider
    }));
  }
  
  // TODO: move this above router
  // Static files
  router.use(middleware.static());
 
   // Environment variables
   middleware.env({
     data: env,
     router: router
   });
  
  // default favicon
  router.use(function (req, res, next) {
    
    favicon(FAVICON_PATH)(req, res, next);
  });
  
  // Static router
  router.use(middleware.staticRouter({
    routes: config.routes
  }));
  
  // Custom not found
  if (config.error_page) {
    router.use(middleware.customNotFound({
      config: config
    }));
  }
  
  // Remove response helpers
  router.use(function (req, res, next) {
    
    res.__ = undefined;
    next();
  });
  
  return router;
};