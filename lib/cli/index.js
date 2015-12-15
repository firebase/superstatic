/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var nash = require('nash');
var fs = require('fs');
var path = require('path');

var PORT = 3474;
var HOSTNAME = 'localhost';
var CONFIG_FILENAME = ['superstatic.json', 'firebase.json'];
var ENV_FILENAME = '.env.json';
var DEBUG = false;
var LIVE = false;

var env;
try {
  env = JSON.parse(fs.readFileSync(path.resolve(ENV_FILENAME), 'utf8'));
} catch (e) {
  // do nothing
}


module.exports = function() {
  var cli = module.exports = nash();

  // Defaults
  cli.set('port', PORT);
  cli.set('hostname', HOSTNAME);
  cli.set('config', CONFIG_FILENAME);
  cli.set('env', env);
  cli.set('debug', DEBUG);
  cli.set('live', LIVE);

  // If no commands matched, the user probably
  // wants to run a server
  cli.register([
    {
      register: require('./flags')
    },
    {
      register: require('./server'),
      options: {
        server: require('../server')
      }
    }
  ], function() {});

  return cli;
};
