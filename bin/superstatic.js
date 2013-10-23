#!/usr/bin/env node

var spawn = require('child_process').spawn;
var path = require('path');
var argv = require('optimist').argv;
var gaze = require('gaze');
var colors = require('colors');
var Superstatic = require('../lib/server/superstatic_server');
var defaults = require('../lib/defaults');

// app working directory
var watcherGlob = '**';
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;

gaze(path.resolve(awd, watcherGlob), function (err, watcher) {
  var self = this;
  var server = createInstance(awd, host, port);
  
  server.start(function () {
    preamble(host, port);
  });
  
  this.on('all', function (evt, filePath) {
    postamble(evt, filePath);
    
    server.stop(function () {
      server = createInstance(awd, host, port);
      server.start(function () {
        preamble(host, port);
      });
    });
  });
  
});

function createInstance (awd, host, port) {
  return Superstatic.createServer({
    port: port,
    host: host,
    settings: {
      type: 'file',
      options: {
        file: 'superstatic.json', // TODO: change to use ['superstatic.json', 'divshot.json']
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
  console.log('superstatic started'.blue);
  console.log('--------------------');
  console.log('Host:', host);
  console.log('Port:', port);
}

function postamble (evt, filePath) {
  console.log('\n\n');
  console.log(evt.green + ': ' + filePath);
  console.log('Restarting server...'.yellow);
}