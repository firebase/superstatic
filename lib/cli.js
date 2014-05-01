var path         = require('path'),
    fs           = require('fs'),
    domain       = require('domain'),
    EventEmitter = require('events').EventEmitter,
    chokidar     = require('chokidar'),
    minimist     = require('minimist'),
    Server       = require('../lib/superstatic').Server,
    defaults     = require('../lib/defaults'),
    ConfigFile   = require('../lib/server/settings/file'),
    server;

var cli = module.exports = new EventEmitter();

module.exports.run = function(args, cb){

  var argv = minimist(args, {
    alias: { p: 'port', h: 'host', q: 'quiet', c: 'config' },
    boolean: 'debug',
    default: { port: defaults.PORT, host: defaults.HOST }
  });

  var port    = argv.port,
      host    = argv.host,
      debug   = argv.quiet,
      config  = parseOverrideConfig(argv.config) || 'superstatic.json',
      cwd     = argv._[0] ? path.resolve(argv._[0]) : defaults.DIRECTORY,
      envJSON = path.join(cwd, '.env.json');

  startServer(function(){
    var configFile = server.settings.getConfigFileName();
    if (configFile) chokidar.watch(configFile).on('change', configFileChanged);
    cb(server);
  });

  // 
  // @private
  // 

  function parseOverrideConfig (config) {
    var parsed;
    if (!config) return;
    try { parsed = JSON.parse(config); } catch(e) { return; }
    return parsed;
  }

  function startServer (cb) {
    var d = domain.create();
    
    d.run(function () {
      server = createInstance(cwd, host, port);
      server.start(function () {
        cli.emit('data', 'Server started on port ' + port);
        cb();
      });
    });
    
    d.on('error', serverErrorHandler);
  }

  function createInstance (cwd, host, port) {
    var localEnv;

    try { localEnv = require(envJSON); } catch(e) {}
    
    return new Server({
      port: port,
      host: host,
      environment: localEnv,
      cwd: cwd,
      config: config,
      debug: debug,
      _defaults: {
        root: './',
        error_page: path.join(__dirname, '../lib/browser/not_found.html')
      }
    });
  }

  function serverErrorHandler (err) {
    if (err.message.indexOf('EADDRINUSE') > -1) {
      err.message = 'That port is already being used by another program.';
    }

    cli.emit('error', err.stack);
  }

  function configFileChanged () {
    cli.emit('data', 'Configuration file changed. Restarting...');
    server.stop(startServer);
  }

};
