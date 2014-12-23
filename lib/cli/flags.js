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
};