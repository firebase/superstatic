#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var program = require('commander');
var Hapi = require('hapi');
var streamDir = require('stream-dir');
var argv = require('optimist').argv;
var package = require('../package');


var SsConfigFile = require('../lib/config/ss_config_file');
var config = new SsConfigFile({
  file: 'divshot.json',
  cwd: path.resolve(process.cwd(), './spikes')
});

config.loadConfiguration(function () {
  
});























// var internals = {};

// internals._server;
// internals.applicationOptions = {
//   files: [],
//   root: process.cwd(),
  
// };
// internals.config = {
//   port: 3474,
//   host: '127.0.0.1',
//   directory: process.cwd()
// };

// internals.setPort = function (port) {
//   internals.config.port = port || internals.config.port;
// };

// internals.setHost = function (host) {
//   internals.config.host = host || internals.config.host;
// };

// internals.setDirectory = function (directory) {
//   directory = (directory)
//     ? path.resolve(process.cwd(), directory)
//     : internals.config.directory;
    
//   internals.config.directory = directory;
// }

// internals._removeCwdPrefix  = function (path) {
//   return path.replace(internals.config.directory, '');
// };

// internals._configureApplicationOptions = function (callback) {
//   callback = callback || function () {};
  
//   streamDir(internals.config.directory)
//     .on('data', function (filePath) {
//       internals.applicationOptions.files.push(internals._removeCwdPrefix(filePath));
//     }).on('end', function () {
//       callback(internals.applicationOptions);
//     });
// };

// internals.createServer = function () {
//   return internals._server = internals._server || new Hapi.Server(internals.config.host, internals.config.port);
// };

// internals.intercept = function () {
//   this._server.route({
//     method: 'GET',
//     path: '/{p*}',
//     config: {
//       handler: function (request, reply) {
//         reply('hey');
//       }
//     }
//   });
// };

// internals.startServer = function (callback) {
//   callback = callback || function () {};
  
//   internals._configureApplicationOptions();
//   internals.createServer();
//   internals.intercept();
  
//   internals._server.start(function (err) {
//     if (!err) {
//       console.log('\n');
//       console.log('Server started'.blue);
//       console.log('---------------'.blue);
//       console.log('HOST:', internals.config.host);
//       console.log('PORT:', internals.config.port);
//     }
    
//     callback(err)
//   });
  
//   return internals._server;
// };





// internals.setPort(argv.port || argv.p);
// internals.setHost(argv.host || argv.h);
// internals.setDirectory(argv._[0]);

// internals.startServer();


// Options/config
// -----------------
// - root
// - clean_urls
// - routes
// - error_page
// - max_age














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

