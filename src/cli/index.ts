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

import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";

const pkg = require("../../package.json"); // eslint-disable-line @typescript-eslint/no-var-requires
import server = require("../server");

const PORT = "3474";
const HOSTNAME = "localhost";
const CONFIG_FILENAME = ["superstatic.json", "firebase.json"];
const ENV_FILENAME = ".env.json";

let env: Record<string, string> | undefined = undefined;
try {
  env = JSON.parse(fs.readFileSync(path.resolve(ENV_FILENAME), "utf8"));
} catch (e) {
  // do nothing
}

const cli = new Command();

cli.name("superstatic").version(pkg.version, "-v, --version");

cli
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
        cwd: path.join(process.cwd(), folder),
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
        `Superstatic started.\nVisit http://${options.hostname}:${options.port} to view your app.`,
      );
    });
  });

export default cli;
