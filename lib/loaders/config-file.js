/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs');

var _ = require('lodash');
var join = require('join-path');
var clearRequire = require('clear-require');
var jfig = require('jfig');
var firstKey = require('firstkey');

var CONFIG_FILE = ['superstatic.json', 'firebase.json', 'divshot.json'];//, 'package.json'];

module.exports = function (filename) {
  if (_.isFunction(filename)) { return filename; }
  
  filename = filename || CONFIG_FILE;
  var configObject = {};
  var config = {};

  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
  }
  catch (e) {
    if (_.isObject(filename) && !Array.isArray(filename)) {
      configObject = filename;
    }
  }

  if (Array.isArray(filename)) {
    filename = _.find(filename, function (name) {

      return fs.existsSync(join(process.cwd(), name));
    });
  }

  // Set back to default config file if stringified object is
  // given as config. With this, we override values in the config file
  if (_.isObject(filename) && !Array.isArray(filename)) {
    filename = CONFIG_FILE;
  }


  // A file name or array of file names
  if (_.isString(filename) || Array.isArray(filename)) {

    // Load config from file by file name
    config = jfig(filename, {
      root: process.cwd(),
      // pluck: function (obj, f) {

      //   // Pluck app config key from package.json file
      //   if (_.contains(f, 'package.json')) {
      //     var key = firstKey.apply(null, [obj].concat(CONFIG_NAME));
      //     return obj[key];
      //   }

      //   return obj;
      // }
    });

  }

  // Passing an object as the config value merges
  // the config data
  return _.extend(config, configObject);
};
