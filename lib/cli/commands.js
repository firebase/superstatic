var join = require('join-path');

exports.register = function (cli, imports) {
  
  var serve = imports.serve;
  
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
        env: '.env.json' // TODO: make this buid into file loader (like config)
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
      var app = serve(options);
      var server = app.listen(done);
      
      cli.set('server', server);
      cli.set('app', app);
    });
};