/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var nash = require('nash');

var PORT = 3474;
var HOSTNAME = 'localhost';
var CONFIG_FILENAME = ['superstatic.json', 'divshot.json'];//, 'package.json'];
var ENV_FILENAME = '.env.json';
var DEBUG = false;
var LIVE = false;

module.exports = function () {

  var cli = module.exports = nash();

  // Defaults
  cli.set('port', PORT);
  cli.set('hostname', HOSTNAME);
  cli.set('config', CONFIG_FILENAME);
  cli.set('env', ENV_FILENAME);
  cli.set('debug', DEBUG);
  cli.set('live', LIVE);

  // cli.register([
  //   {
  //     register: require('./flags')
  //   },
  //   {
  //     register: require('./server'),
  //     options: {
  //       server: require('../server')
  //     }
  //   }
  // ], function (err) {});

  // Register flags
  // cli.register(require('./flags'));

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
  ], function (err) {});

  return cli;
};
