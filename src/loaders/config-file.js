/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const fs = require("fs");

const _ = require("lodash");
const join = require("join-path");
const path = require("path");

const CONFIG_FILE = ["superstatic.json", "firebase.json"];

module.exports = function(filename) {
  if (_.isFunction(filename)) {
    return filename;
  }

  filename = filename || CONFIG_FILE;

  let configObject = {};
  let config = {};

  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
  } catch (e) {
    if (_.isPlainObject(filename)) {
      configObject = filename;
      filename = CONFIG_FILE;
    }
  }

  if (_.isArray(filename)) {
    filename = _.find(filename, (name) => {
      return fs.existsSync(join(process.cwd(), name));
    });
  }

  // Set back to default config file if stringified object is
  // given as config. With this, we override values in the config file
  if (_.isPlainObject(filename)) {
    filename = CONFIG_FILE;
  }

  // A file name or array of file names
  if (_.isString(filename) && _.endsWith(filename, "json")) {
    try {
      config = JSON.parse(fs.readFileSync(path.resolve(filename)));
      config = config.hosting ? config.hosting : config;
    } catch (e) {
      // do nothing
    }
  }

  // Passing an object as the config value merges
  // the config data
  return _.assign(config, configObject);
};
