var path = require('path');
var fs = require('fs');
var chokidar = require('chokidar');
var argv = require('minimist')(process.argv.slice(2));
var superstatic = require('../lib');
var defaults = require('../lib/defaults');
var _ = require('lodash');
var Nash = require('nash');
var format = require('chalk');
var domain = require('domain');
var Van = require('van');

var cli = module.exports = Nash.createCli({
  title: format.bold('Superstatic:') + ' A static file server for fancy apps',
  commandName: 'superstatic',
  port: defaults.PORT,
  host: defaults.HOST,
  quiet: defaults.DEBUG,
  scripts: {}
});

cli.usage('superstatic <OPTIONAL root directory> <options>');

cli.flag('-p', '--port')
  .description('server port')
  .handler(function (port) {
    cli.port = port;
  });

cli.flag('--services')
  .description('comma delimited list of services to load')
  .handler(function (services) {
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

// TODO: test
cli.flag('--run')
  .description('run script')
  .exit(true)
  .handler(function (script) {
    if (script === true) return cli.error('Script name required');
    
    var scripts = configureScriptsFromConfig([script]);
    
    if (!scripts[script]) return cli.error('Script not defined');
    
    var van = new Van({
      scripts: _.pick(scripts, script) // Run single script
    });
    van.start();
  });

// TODO: test
cli.flag('--with')
  .description('run scripts in parallel')
  .exit(true)
  .handler(function (scripts) {
    if (scripts === true) return cli.error('Script name required');
    
    var scriptsToRun = scripts.split(',');
    scripts = configureScriptsFromConfig(scriptsToRun, {
      superstatic: 'superstatic ' + parseServerArgs(cli.args.args)
    });
    
    // warn about undefined scripts
    cli.log();
    scriptsToRun.forEach(function (script) {
      if (!scripts[script]) cli.emit('warn', format.bold(script) + ' not defined. Script not run.');
    });
    cli.log();
    
    // run scripts
    var van = new Van({
      scripts: scripts
    });
    van.start();
    
    function parseServerArgs (args) {
      return _(args)
        .omit('with')
        .reduce(function (str, val, flag) {
          return str += (val === true) ? ' --' + flag : ' --' + flag + ' ' + val;
        }, '');
    }
  });

function parseOverrideConfig (argv) {
  var overrideConfig = argv.config || argv.c || undefined;
  
  try { overrideConfig = JSON.parse(overrideConfig); }
  catch (e) {}
  
  return overrideConfig;
}

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

function configureScriptsFromConfig (scriptsToKeep, defaultScripts) {
  var cwd = process.cwd();
  var config = parseOverrideConfig(cli.args.args);
  
  if (typeof config === 'string') config = tryRequire(cwd + '/' + config) || {};
  if (!config) config = tryRequire(cwd + '/divshot.json') || tryRequire(cwd + '/superstatic.json');
  
  var scripts = _.pick(config.scripts, scriptsToKeep);
  
  return _.extend(defaultScripts || {}, scripts);
}