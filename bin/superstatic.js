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

var defaults = {
  PORT: 3474,
  HOST: '127.0.0.1',
  DIRECTORY: process.cwd()
};

var server = Superstatic.createServer({
  port: defaults.PORT,
  host: defaults.HOST,
  settings: {
    type: 'file',
    options: {
      file: 'divshot.json',
      cwd: path.resolve(process.cwd(), './spikes')
    }
  },
  store: {
    type: 'local',
    options: {
      cwd: path.resolve(process.cwd(), './spikes')
    }
  }
});

server.start(function () {
  server.settings.configure(function (err, config) {
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

