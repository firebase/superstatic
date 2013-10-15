#!/usr/bin/env node

var path = require('path');
var Superstatic = require('superstatic-server');
var gaze = require('gaze');
var colors = require('colors');
var argv = require('optimist').argv;
var defaults = require('../lib/defaults');
var server = require('../lib/server');

// app working directory
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;
 
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var staticServer = server.createInstance(awd, host, port);

gaze(path.resolve(awd, '**'), function (err, watcher) {
  var self = this;
  
  server.start(staticServer, function () {
    self.on('all', function (event, filePath) {
      console.log('\n\n');
      console.log(event.green + ': ' + filePath);
      
      server.restart(staticServer);
    });
  });
  
});