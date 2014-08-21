var parseOverrideConfig = require('../utils/parse-override-config');

module.exports = function (cli) {
  cli.flag('-p', '--port')
    .description('server port')
    .handler(function (port) {
      cli.port = port;
    });

  cli.flag('--host')
    .description('server host')
    .handler(function (host) {
      cli.host = host;
    });

  cli.flag('-q', '--quiet')
    .description('mute the network traffic output')
    .handler(function () {
      cli.quiet = false;
    });

  cli.flag('-c', '--config')
    .description('set a custom app config file or object')
    .handler(function (config) {
      cli.config = parseOverrideConfig(cli.args.args) || config;
    });
  
  require('./services')(cli); // --services
  require('./run')(cli); // --run
  require('./prepare')(cli); // --prepare
  require('./with')(cli); // --with
};
