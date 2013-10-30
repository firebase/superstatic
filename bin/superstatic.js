#!/usr/bin/env node

require('colors');

var path = require('path');
var argv = require('optimist').argv;
var Superstatic = require('../lib/server/superstatic_server');
var defaults = require('../lib/defaults');

// app working directory
var watcherGlob = '**/*';
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;

var server = createInstance(awd, host, port);
server.start(function () {
  preamble(host, port);
});

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
  console.log('');
  console.log('server started on port ' + port.toString().bold.blue);
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