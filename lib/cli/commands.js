var http = require('http');
var connect = require('connect');
var join = require('join-path');
var networkLogger = require('morgan');
var compression = require('compression');

exports.register = function (cli, imports) {
  
  var superstatic = imports.superstatic;
  
  cli.default()
    .async()
    .handler(function (workingDirectory, done) {
      
      var config = cli.get('config');
      
      var options = {
        config: config
      };
      
      cli.set('options', options);
      
      if (typeof workingDirectory === 'function') {
        done = workingDirectory;
        workingDirectory = undefined;
      }
      
      if (workingDirectory) {
        options.cwd = join(process.cwd(), workingDirectory);
      }
      
      var port = cli.get('port');
      var hostname = cli.get('hostname');
      var debug = cli.get('debug');
      var gzip = cli.get('gzip');
      var app = connect();
      
      if (debug) {
        app.use(networkLogger('combined'));
      }
      
      // TODO: fix this
      // Server crashes
      // Something to do with res object methods and 
      // compression
      if (gzip) {
        app.use(compression());
      }
      
      app.use(superstatic(options));
      
      var server = http.createServer(app);
      cli.set('server', server);
      cli.set('app', app);
      
      // Start server
      server.listen(port, hostname, done);
    });
};