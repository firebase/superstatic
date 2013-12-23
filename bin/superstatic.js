#!/usr/bin/env node

require('colors');

var path = require('path');
var chokidar = require('chokidar');
var argv = require('optimist').argv;
var Superstatic = require('../lib/server/superstatic_server');
var defaults = require('../lib/defaults');
var ConfigFile = require('../lib/server/config/file');
var server;

// app working directory
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;

startServer();

// Watch config file for changes
process.nextTick(function () {
  try{
    chokidar.watch(server.settings.getConfigFileName())
      .on('change', configFileChanged);
  }
  catch (e) {}
});

function configFileChanged () {
  console.log('Configuration file changed. Restarting...');
  server.stop(startServer);
}

function startServer () {
  server = createInstance(awd, host, port);
  server.start(function () {
    preamble(host, port);
  });
}

function createInstance (awd, host, port) {
  return Superstatic.createServer({
    port: port,
    host: host,
    settings: {
      type: 'file',
      options: {
        file: (argv.c || argv.config || 'superstatic.json'),
        cwd: awd
      }
    },
    store: {
      type: 'local',
      options: {
        cwd: awd
      }
    }
  });
};

function preamble (host, port) {
  console.log('Server started on port ' + port.toString());
  console.log('');
}

function postamble (evt, filePath) {
  console.log('');
  console.log(evt.green + ': ' + filePath);
  process.stdout.write('Reconfiguring server ... '.yellow);
}

function doneabmle () {
  process.stdout.write('done'.blue);
  console.log('\n\nListening for changes...');
}