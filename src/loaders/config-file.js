/**
 * Copyright (c) 2022 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const fs = require("fs");

const _ = require("lodash");
const join = require("join-path");
const path = require("path");

const CONFIG_FILE = ["superstatic.json", "firebase.json"];

module.exports = function (filename) {
  if (_.isFunction(filename)) {
    return filename;
  }

  filename = filename ?? CONFIG_FILE;

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
      config = config.hosting ?? config;
    } catch (e) {
      // do nothing
    }
  }

  // Passing an object as the config value merges
  // the config data
  return _.assign(config, configObject);
};
