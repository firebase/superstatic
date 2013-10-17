#!/usr/bin/env node

var path = require('path');
var argv = require('optimist').argv;
var defaults = require('../lib/defaults');
var cli = require('../lib/cli');

// app working directory
var port = exports.port =  argv.port || argv.p || defaults.PORT;
var host = exports.host = argv.host || argv.h || defaults.HOST;
var awd = exports.awd = (argv._[0])
 ? path.resolve(process.cwd(), argv._[0])
 : defaults.DIRECTORY;
 
 cli.watch(cli.createInstance(awd, host, port), path.resolve(awd, '**'));