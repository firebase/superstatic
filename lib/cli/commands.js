var join = require('join-path');

exports.register = function (cli, imports) {
  
  var server = imports.server;
  
  cli.default()
    .async()
    .handler(function (workingDirectory, done) {
      
      var config = cli.get('config');
      var port = cli.get('port');
      var hostname = cli.get('hostname');
      var debug = cli.get('debug');
      var gzip = cli.get('gzip');
      
      var options = {
        config: config,
        port: port,
        hostname: hostname,
        gzip: gzip,
        debug: debug,
        
        // TODO: make this buid into file loader (like config)
        // TODO: write test (in test/unit/cli.js)
        env: '.env.json' 
      };
      
      cli.set('options', options);
      
      if (typeof workingDirectory === 'function') {
        done = workingDirectory;
        workingDirectory = undefined;
      }
      
      if (workingDirectory) {
        options.cwd = join(process.cwd(), workingDirectory);
      }
      
      // Start server
      var app = server(options);
      
      cli.set('server', app.listen(done));
      cli.set('app', app);
    });
};