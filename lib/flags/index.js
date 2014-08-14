var parseOverrideConfig = require('../utils/parse-override-config');

module.exports = function (cli) {
  cli.flag('-v', '--version')
    .description('Superstatic version number')
    .exit(true)
    .handler(function () {
      var pkg = require('../../package.json');
      if (pkg) cli.log(pkg.version);
    });
  
  cli.flag('-p', '--port')
    .description('server port')
    .handler(function (port) {
      cli.port = port;
    });

  cli.flag('--host', '-o')
    .description('server host')
    .handler(function (host) {
      cli.host = host;
    });

  cli.flag('-q', '--quiet')
    .description('mute the network traffic output')
    .handler(function () {
      cli.quiet = false;
    });

  cli.flag('--debug')
    .description('mute the network traffic output')
    .handler(function (debug) {
      cli.quiet = false;
    });
    
  cli.flag('-c', '--config')
    .description('set a custom app config file or object')
    .handler(function (config) {
      cli.config = parseOverrideConfig(cli.args.args) || JSON.parse(config);
    });
  
  
  require('./services')(cli); // --services
  require('./run')(cli); // --run
  require('./prepare')(cli); // --prepare
  require('./with')(cli); // --with
};
