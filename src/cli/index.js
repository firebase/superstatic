/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const { Command } = require("commander");
const join = require("join-path");
const fs = require("fs");
const path = require("path");
const pkg = require("../../package.json");
const server = require("../server");

const PORT = 3474;
const HOSTNAME = "localhost";
const CONFIG_FILENAME = ["superstatic.json", "firebase.json"];
const ENV_FILENAME = ".env.json";

let env;
try {
  env = JSON.parse(fs.readFileSync(path.resolve(ENV_FILENAME), "utf8"));
} catch (e) {
  // do nothing
}

const program = new Command();

program.name("superstatic").version(pkg.version, "-v, --version");

program
  .command("serve", { isDefault: true })
  .argument("[folder]")
  .option("-p, --port <port>", "Port", PORT)
  .option("--host, --hostname <hostname>", "Hostname", HOSTNAME)
  .option("-c, --config <config>", "Filename of config", CONFIG_FILENAME)
  .option("--debug")
  .option("--gzip")
  .option("--compression")
  .description("start server")
  .action((folder, options) => {
    return new Promise((resolve) => {
      const app = server({
        cwd: join(process.cwd(), folder),
        config: options.config,
        port: options.port,
        hostname: options.hostname,
        compression: options.compression,
        debug: options.debug,
        env: env,
      });
      app.listen(() => resolve());
      console.log(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Superstatic started.\nVisit http://${options.hostname}:${options.port} to view your app.`
      );
    });
  });

module.exports = program;
