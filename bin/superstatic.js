#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var path = require('path');
var colors = require('colors');
var program = require('commander');
var Hapi = require('hapi');
var streamDir = require('stream-dir');
var argv = require('optimist').argv;
var package = require('../package');

var Superstatic = require('../lib/superstatic');
var SsConfigFile = require('../lib/config/ss_config_file');
var SsStoreLocal = require('../lib/store/ss_store_local');

var defaults = {
  PORT: 3474,
  HOST: '127.0.0.1',
  DIRECTORY: process.cwd()
};

var ssConfig = new SsConfigFile({
  file: 'divshot.json',
  cwd: path.resolve(process.cwd(), './spikes')
});

var ssStore = new SsStoreLocal({
  cwd: path.resolve(process.cwd(), './spikes')
});

var superstatic = new Superstatic({
  config: ssConfig,
  store: ssStore,
  port: defaults.PORT,
  host: defaults.HOST,
});

superstatic.start(function () {
  ssConfig.loadConfiguration(function (err, config) {
    console.log('superstatic started'.blue);
  });
});


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

