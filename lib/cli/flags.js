exports.register = function (cli, options) {
  
  cli.flag('--port', '-p')
    .handler(function (num) {
      
      cli.set('port', num);
    });
  
  cli.flag('--host', '--hostname')
    .handler(function (hostname) {
      
      cli.set('hostname', hostname);
    });
  
  cli.flag('--config', '-c')
    .handler(function (config) {
      
      cli.set('config', config);
    });
  
  cli.flag('--debug')
    .handler(function (shouldDebug) {
      
      cli.set('debug', shouldDebug);
    });
  
  cli.flag('--gzip')
    .handler(function (shouldCompress) {
      
      cli.set('gzip', shouldCompress);
    });
  
  cli.flag('--version',  '-v')
    .exit()
    .handler(function () {
      
      var pkg = require('../../package.json');
      console.log(pkg.version);
    });
};