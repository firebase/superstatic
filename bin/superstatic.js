#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var program = require('commander');
var Hapi = require('hapi');
var argv = require('optimist').argv;
var package = require('../package');

var internals = {};
internals.config = {
  port: 3474,
  host: '127.0.0.1',
  directory: process.cwd()
};

internals.setPort = function (port) {
  internals.config.port = port || internals.config.port;
};

internals.setHost = function (host) {
  internals.config.host = host || internals.config.host;
};

internals.setDirectory = function (directory) {
  directory = (directory)
    ? path.resolve(process.cwd(), directory)
    : internals.config.directory;
    
  internals.config.directory = directory;
}

internals.setPort(argv.port || argv.p);
internals.setHost(argv.host || argv.h);
internals.setDirectory(argv._[0]);

var server = new Hapi.Server(internals.config.host, internals.config.port);








server.start(function () {
  console.log('\n');
  console.log('Server started'.blue);
  console.log('---------------'.blue);
  console.log('HOST:', internals.config.host);
  console.log('PORT:', internals.config.port);
});













// program
//   .option('-p, --port [port]', 'Server port', internals.setPort)
//   .option('-h, --host [hostname]', 'Server hostname', internals.setHostname)
//   .version(package.version)
//   .usage('[options] filename');

// program
//   .command('* [directory]')
//   .description('Start the Superstatic server') 
//   .action(function (directory) {
//     internals.setDirectory(directory);
//   });
  
// program.parse(process.argv);

