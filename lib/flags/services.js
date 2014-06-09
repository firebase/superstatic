var _ = require('lodash');
var tryRequire = require('../utils/try-require');
var format = require('chalk');
var path = require('path');

module.exports = function (cli) {
  cli.flag('--services')
    .description('comma delimited list of services to load')
    .handler(function (services) {
      cli.log();
      cli.services = _(services.split(','))
        .map(function (name) {
          // TOOD: pass values to service module
          var serviceModule = serviceRequire(name);
          if (serviceModule) return [name, serviceModule()];
        })
        .compact()
        .zipObject()
        .value();
    });
  
  //
  function serviceRequire (name) {
    var nodePath = path.join(process.cwd(), 'node_modules');
    var nameVariances = [
      path.join(nodePath, 'superstatic-' + name),
      path.join(nodePath, name),
      path.join(process.cwd(), name)
    ];
    
    var serviceModule =
      _(nameVariances)
        .map(tryRequire)
        .compact()
        .first();
      
    if (!serviceModule) cli.emit('warn', 'The service ' + format.bold(name) + ' does not exist in this directory and was not loaded.');
    
    return serviceModule;
  }
};