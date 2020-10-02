/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const nash = require("nash");
const fs = require("fs");
const path = require("path");

const PORT = 3474;
const HOSTNAME = "localhost";
const CONFIG_FILENAME = ["superstatic.json", "firebase.json"];
const ENV_FILENAME = ".env.json";
const DEBUG = false;
const LIVE = false;

let env;
try {
  env = JSON.parse(fs.readFileSync(path.resolve(ENV_FILENAME), "utf8"));
} catch (e) {
  // do nothing
}

module.exports = function() {
  const cli = (module.exports = nash());

  // Defaults
  cli.set("port", PORT);
  cli.set("hostname", HOSTNAME);
  cli.set("config", CONFIG_FILENAME);
  cli.set("env", env);
  cli.set("debug", DEBUG);
  cli.set("live", LIVE);

  // If no commands matched, the user probably
  // wants to run a server
  cli.register(
    [
      {
        register: require("./flags")
      },
      {
        register: require("./server"),
        options: {
          server: require("../server")
        }
      }
    ],
    () => {}
  );

  return cli;
};
