var http = require('http');
var connect = require('connect');
var join = require('join-path');

exports.register = function (cli, imports) {
  
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
      
      var app = connect()
        .use(imports.superstatic(options));
      
      var server = http.createServer(app);
      cli.set('server', server);
      cli.set('app', app);
      
      // Start server
      server.listen(port, hostname, done);
    });
};