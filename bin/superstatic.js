#!/usr/bin/env node

var spawn = require('child_process').spawn;
var path = require('path');
var argv = require('optimist').argv;
var defaults = require('../lib/defaults');
var startCli = require('../lib/cli');

// app working directory
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;


var nodemonCmd = path.resolve(__dirname, '../node_modules/.bin/nodemon');
var appDir = path.resolve(__dirname, '../lib/cli.js');
var watcher = spawn(nodemonCmd, [appDir, awd, '--watch', awd, '-e', 'json']);

watcher.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

watcher.stdout.on('data', function (data) {
  process.stdout.write(data.toString());
});

watcher.on('error', function () {
  console.log('ERRORRRRR:', arguments);
});

watcher.on('close', function () {
  console.log('CLOSED');
});




startCli(awd, host, port);

// cli.watch(cli.createInstance(awd, host, port), path.resolve(awd, '**'));

