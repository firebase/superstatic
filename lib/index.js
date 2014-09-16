// Replace core URL module with fast-url-parser module.
// Much faster!
// Benchmarks: https://github.com/divshot/superstatic/issues/95
require("fast-url-parser").replace();

var _ = require('lodash');
var connect = require('connect');
var query = require('connect-query');
var compress = require('compression');
var networkLogger = require('morgan');
var ConfigFile = require('./settings/file');
var serverDefaults = require('./defaults');
var storeFactory = require('./utils/store-factory');

var stacker = require('./stacker');
var logger = require('./middleware/logger');
var restful = require('./middleware/restful');
var configure = require('./middleware/configure');

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
    localEnv: {},
    track: [] // Should be ['services'] to track services, etc.
  };
  
  // Generate server with extended options
  var app = _.extend(connect(), defaults, options, {
    store: storeFactory(options.store, options.cwd)
  });
  
  // Prepended middleware
  if (app._prepend) app.use(app._prepend);
  
  // Default middleware
  if (app.debug !== false || app.quiet === true) app.use(networkLogger('combined'));
  
  app.use(logger(app.debug, app.logger));
  app.use(query());
  
  if (app.gzip !== false) app.use(compress());
  
  app.use(restful(app.routes, app.settings));
  
  if (!process.env.SITE) app.use(configure(app.settings));
  
  app.listen = function (port, host, cb) {
    
    // FOR TESTING: put back out of listen() method. It's here for testing
    if (process.env.SITE) app.use(configure(app.settings));
    
    // Handle any number of arguments
    if (typeof arguments[0] === 'number' && app.port === serverDefaults.PORT) app.port = arguments[0];
    if (typeof arguments[1] === 'string' && app.host === serverDefaults.HOST) app.host = arguments[1];
    if (typeof arguments[0] === 'function') cb = arguments[0];
    if (typeof arguments[1] === 'function') cb = arguments[1];
    
    // Test mode just returns with server without the stack
    // Userful for testing basic/default functionality
    if (app.testMode) return cb();
    
    // This is the meat of Superstatic.
    // This is where all the features of the requested app are toggled
    // on or off. It's a dynamic middleware stack for each request.
    app.use(stacker(app));
    
    // https
    if (_.isObject(options.secure)) {
      if (!options.secure.key) throw new Error('Private key file is expected in order to run Superstatic over SSL/TLS');
      if (!options.secure.cert) throw new Error('Certificate file is expected in order to run Superstatic over SSL/TLS');      
      
      app.server = require('https').createServer(app.secure, app);
    }
    
    // http
    else {
      app.server = require('http').createServer(app);
    }
    
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

// NOTE: divshot-cli uses these defaults. Perhaps this should just
// be a module
exports.defaultSettings = require('./settings/default');
