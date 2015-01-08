var http = require('http');

var connect = require('connect');
var networkLogger = require('morgan');
var compression = require('compression');

var superstatic = require('./superstatic');
var notFound = require('./middleware/not-found');

var DEFAULT_ERROR_PAGE = __dirname + '/assets/not_found.html';

module.exports = function (spec) {
  
  spec = spec || {};
  
  var defaultErrorPage = spec.errorPage || DEFAULT_ERROR_PAGE;
  var app = connect();
  var listen = app.listen.bind(app);
  
  // Override method because port and host are given
  // in the spec object
  app.listen = function (done) {
    
    return listen(spec.port, spec.hostname || spec.host, done);
  };
  
  if (spec.debug) {
    app.use(networkLogger('combined'));
  }
  
  // TODO: gzip not working
  // Server crashes
  // Something to do with res object methods and 
  // compression
  if (spec.gzip) {
    app.use(compression());
  }
  
  app.use(superstatic(spec));
  
  // Handle not found pages
  app.use(notFound({
    file: defaultErrorPage
  }));
  
  return app;
};