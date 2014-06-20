// Replace core URL module with fast-url-parser module.
// Much faster!
// Benchmarks: https://github.com/divshot/superstatic/issues/95
require("fast-url-parser").replace();

var connect = require('connect');
var http = require('http');
var _ = require('lodash');
var query = require('connect-query');
var compress = require('compression');
var networkLogger = require('morgan');
var middleware = require('./middleware');
var ConfigFile = require('./settings/file');
var serverDefaults = require('./defaults');
var storeFactory = require('./utils/store-factory');
var stacker = require('./stacker');

var exports = module.exports = function (options) {
  options = options || {};
  
  var defaults = {
    port: serverDefaults.PORT,
    host: serverDefaults.HOST,
    cwd: serverDefaults.DIRECTORY,
    services: serverDefaults.SERVICES,
    servicesRoutePrefix: serverDefaults.SERVICES_ROUTE_PREFIX,
    routes: [],
    settings: new ConfigFile(options),
    localEnv: {}
  };
  
  // Generate server with extended options
  var app = _.extend(connect(), defaults, options, {
    store: storeFactory(options.store, options.cwd)
  });
  
  // Default middleware
  if (app.debug !== false) app.use(networkLogger());
  app.use(middleware.logger(app.debug, app.logger));
  app.use(query());
  if (app.gzip !== false) app.use(compress());
  app.use(middleware.restful(app.routes, app.settings));
  app.use(middleware.configure(app.settings));
  
  app.listen = function (port, host, cb) {
    if (typeof arguments[0] === 'number' && app.port === serverDefaults.PORT) app.port = arguments[0];
    if (typeof arguments[1] === 'string' && app.host === serverDefaults.HOST) app.host = arguments[1];
    if (typeof arguments[0] === 'function') cb = arguments[0];
    if (typeof arguments[1] === 'function') cb = arguments[1];
    
    if (app.testMode) return cb();
    
    app.use(stacker(app));
    app.server = http.createServer(app);
    app.server.listen(app.port, app.host, cb);
    
    return app.server;
  };
  
  app.close = function () {
    app.server.close.apply(app.server, arguments);
  };
  
  app.route = function (routeOptions) {
    app.routes.push(routeOptions);
  };
  
  return app;
};

// TODO: why do we need this?
exports.defaultSettings = require('./settings/default');