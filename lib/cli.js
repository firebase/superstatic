var path = require('path');
var chokidar = require('chokidar');
var argv = require('minimist')(process.argv.slice(2));
var superstatic = require('../lib');
var defaults = require('../lib/defaults');
var _ = require('lodash');
var Nash = require('nash');
var format = require('chalk');
var domain = require('domain');

var cli = module.exports = Nash.createCli({
  title: format.bold('Superstatic:') + ' A static file server for fancy apps',
  commandName: 'superstatic',
  port: defaults.PORT,
  host: defaults.HOST,
  quiet: defaults.DEBUG,
  services: parseServices(argv)
});

cli.usage('superstatic <OPTIONAL root directory> <options>');

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

cli.catchAll(function (type, attemptedCommand) {
  var dir = cli.args.command;
  cli.cwd = dir ? path.resolve(process.cwd(), dir) : defaults.DIRECTORY;
  
  startServer(function () {
    var configFile = cli.server.settings.getConfigFileName();
    if (configFile) chokidar.watch(configFile).on('change', configFileChanged);
  });
});

function parseOverrideConfig (argv) {
  var overrideConfig = argv.config || argv.c || undefined;
  
  try { overrideConfig = JSON.parse(overrideConfig); }
  catch (e) {}
  
  return overrideConfig;
}

function parseServices (argv) {
  var s = (argv.services) ? argv.services.split(',') : [];
  
  return _(s)
    .map(function (name) {return name.toLowerCase();})
    .map(function (name) {
      var serviceModule = tryRequire('superstatic-' + name) || tryRequire(name);
      if (serviceModule) return [name, serviceModule()];
    })
    .filter(_.identity)
    .zipObject()
    .value();
}

function startServer (done) {
  var d = domain.create();
  
  d.run(function () {
    cli.server = createServerInstance(cli);
    cli.server.start(function () {
      cli.log('\nServer started on port ' + cli.port);
      cli.emit('started', cli.server);
      done && done();
    });
  });
  
  d.on('error', serverErrorHandler);
}

function createServerInstance (cli) {
  var localEnv = tryRequire(path.join(cli.cwd, "./.env.json"));
  
  return cli.server || superstatic.createServer({
    port: cli.port,
    host: cli.host,
    environment: localEnv,
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
  cli.server.stop(startServer);
}

function serverErrorHandler (err) {
  if (err.message.indexOf('EADDRINUSE') > -1) {
    err.message = 'That port is already being used by another program.';
  }
  
  cli.error(err.stack);
}

function tryRequire (moduleName) {
  var serviceModule;
  
  try {serviceModule = require(moduleName);}
  catch (e) {}
  
  return serviceModule;
}