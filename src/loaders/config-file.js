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

const path = require("path");
const { isPlainObject } = require("../utils/objectutils");

const CONFIG_FILE = ["superstatic.json", "firebase.json"];

module.exports = function (filename, mergeConfig = true) {
  if (typeof filename === "function") {
    return filename;
  }

  filename = filename ?? CONFIG_FILE;

  let configObject = {};
  let configObjectProvided = false;
  let config = {};

  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
    configObjectProvided = true;
  } catch {
    if (isPlainObject(filename)) {
      configObject = filename;
      configObjectProvided = true;
      filename = CONFIG_FILE;
    }
  }

  if (Array.isArray(filename)) {
    filename = filename.find((name) => {
      return fs.existsSync(path.join(process.cwd(), name));
    });
  }

  // Set back to default config file if stringified object is
  // given as config. With this, we override values in the config file
  if (isPlainObject(filename)) {
    filename = CONFIG_FILE;
  }

  // A file name or array of file names
  if (typeof filename === "string" && filename.endsWith("json")) {
    try {
      config = JSON.parse(fs.readFileSync(path.resolve(filename)));
      config = config.hosting ?? config;
    } catch {
      // do nothing
    }
  }

  // Passing an object as the config value merges
  // the config data
  return configObjectProvided && !mergeConfig ? configObject : { ...config, ...configObject };
};
