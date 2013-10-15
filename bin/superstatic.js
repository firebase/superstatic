#!/usr/bin/env node

var path = require('path');
var Superstatic = require('superstatic-server');
var gaze = require('gaze');
var colors = require('colors');
var argv = require('optimist').argv;
var package = require('../package');

var defaults = exports.defaults = {
  PORT: 3474,
  HOST: '127.0.0.1',
  DIRECTORY: process.cwd()
};

// app working directory
var awd = exports.awd = argv._[0] 
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY
 
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var server = exports.server = Superstatic.createServer({
  port: port,
  host: host,
  settings: {
    type: 'file',
    options: {
      file: 'divshot.json',
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

var startServer = exports.startServer = function (callback) {
  server.start(function () {
    server.settings.configure(function (err, config) {
      console.log('');
      console.log('superstatic started'.blue);
      console.log('--------------------');
      console.log('Host:', host);
      console.log('Port:', port);
      callback();
    });
  });
}

var stopServer = exports.stopServer = function (callback) {
  server.stop(callback);
}

gaze(path.resolve(awd, '**'), function (err, watcher) {
  var self = this;
  
  startServer(function () {
    self.on('all', function (event, filePath) {
      console.log('\n\n');
      console.log(event.green + ': ' + filePath);
      
      stopServer(function () {
        console.log('Restarting server...'.yellow);
        startServer(function () {});
      });
    });
  });
  
});