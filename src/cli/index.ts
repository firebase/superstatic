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

import server from "../server";
import { isPlainObject } from "../utils/objectutils";

interface ServeOptions {
  config?: string | string[];
  port?: string;
  hostname?: string;
  compression?: boolean;
  gzip?: boolean;
  debug?: boolean;
}

const PORT = "3474";
const HOSTNAME = "localhost";
const CONFIG_FILENAME = ["superstatic.json", "firebase.json"];
const ENV_FILENAME = ".env.json";

const rawPkg: unknown = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"),
);
const pkgVersion =
  isPlainObject(rawPkg) && typeof rawPkg.version === "string"
    ? rawPkg.version
    : "0.0.0";

let env: Record<string, string> | undefined = undefined;
try {
  const parsedEnv: unknown = JSON.parse(
    fs.readFileSync(path.resolve(ENV_FILENAME), "utf8"),
  );
  if (isPlainObject(parsedEnv)) {
    const stringEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsedEnv)) {
      if (typeof value === "string") {
        stringEnv[key] = value;
      }
    }
    env = stringEnv;
  }
} catch {
  // do nothing
}

const cli = new Command();

cli.name("superstatic").version(pkgVersion, "-v, --version");

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
  .action((folder: string | undefined, options: ServeOptions) => {
    return new Promise<void>((resolve) => {
      const parsedPort =
        options.port !== undefined ? Number(options.port) : undefined;
      const app = server({
        cwd: path.join(process.cwd(), folder ?? ""),
        config: options.config,
        port:
          parsedPort !== undefined && !Number.isNaN(parsedPort)
            ? parsedPort
            : undefined,
        hostname: options.hostname,
        compression: options.compression,
        gzip: options.gzip,
        debug: options.debug,
        env: env,
      });
      app.listen(() => resolve());
      console.log(
        `Superstatic started.\nVisit http://${options.hostname ?? HOSTNAME}:${options.port ?? PORT} to view your app.`,
      );
    });
  });

export default cli;
