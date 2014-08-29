var path = require('path');
var superstatic = require('../');
var defaults = require('../lib/defaults');
var Nash = require('nash');
var format = require('chalk');
var domain = require('domain');
var tryRequire = require('./utils/try-require');

var cli = module.exports = Nash.createCli({
  title: format.bold('Superstatic:') + ' A static file server for fancy apps',
  commandName: 'superstatic',
  port: defaults.PORT,
  host: defaults.HOST,
  quiet: defaults.DEBUG
});

cli.usage('superstatic <OPTIONAL root directory> <options>');

// Include flags
require('./flags')(cli);
  
cli.catchAll(function (type, attemptedCommand) {
  var dir = cli.args.command;
  cli.cwd = dir ? path.resolve(process.cwd(), dir) : defaults.DIRECTORY;
  
  startServer(function () {
    var configFile = cli.server.settings.getConfigFileName();
    
    // TODO: review the usefullness of this feature 
    //       (reloading on config file change)
    // if (configFile) chokidar.watch(configFile).on('change', configFileChanged);
  });
});

function startServer (done) {
  var d = domain.create();
  
  d.run(function () {
    cli.server = createServerInstance(cli);
    cli.server.listen(function () {
      cli.log('\nServer started on port ' + cli.port);
      cli.emit('started', cli.server);
      done && done();
    });
  });
  
  d.on('error', serverErrorHandler);
}

function createServerInstance (cli) {
  return cli.server || superstatic({
    port: cli.port,
    host: cli.host,
    localEnv: tryRequire(path.join(cli.cwd, "./.env.json")), // TODO: test this
    cwd: cli.cwd,
    config: cli.config,
    debug: cli.quiet,
    _defaults: {
      root: './'
    },
    services: cli.services
  });
}

function configFileChanged () {
  cli.log('Configuration file changed. Restarting...');
  cli.server.close(startServer);
}

function serverErrorHandler (err) {
  if (err.message.indexOf('EADDRINUSE') > -1) {
    err.message = 'That port is already being used by another program.';
  }
  
  cli.error(err.stack);
}