var http = require('http');

var connect = require('connect');
var networkLogger = require('morgan');
var compression = require('compression');

var superstatic = require('./superstatic');

module.exports = function (spec) {
  
  var app = connect();
  var listen = app.listen.bind(app);
  
  // Override method because port and host are given
  // in the spec object
  app.listen = function (done) {
    
    return listen(spec.port, spec.hostname, done);
  };
  
  if (spec.debug) {
    app.use(networkLogger('combined'));
  }
  
  // TODO: gzip not working
  // Server crashes
  // Something to do with res object methods and 
  // compression
  // if (spec.gzip) {
  //   app.use(compression());
  // }
  
  app.use(superstatic(spec));
  
  return app;
};