#!/usr/bin/env node

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

import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";

import cli from "../cli";
import { isPlainObject } from "../utils/objectutils";

interface PackageJson {
  name: string;
  version: string;
}

interface UpdateNotifierOptions {
  pkg: PackageJson;
  updateCheckInterval?: number;
  shouldNotifyInNpmScript?: boolean;
}

interface UpdateNotifier {
  notify(): void;
}

const requireModule: (id: string) => unknown = createRequire(__filename);
const updateNotifier = requireModule("update-notifier-cjs") as (
  options: UpdateNotifierOptions,
) => UpdateNotifier;

const rawPkg: unknown = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"),
);
const pkg: PackageJson = isPlainObject(rawPkg)
  ? {
      name: typeof rawPkg.name === "string" ? rawPkg.name : "superstatic",
      version: typeof rawPkg.version === "string" ? rawPkg.version : "0.0.0",
    }
  : { name: "superstatic", version: "0.0.0" };

const updateCheckInterval = 1000 * 60 * 60 * 24 * 7; // 1 week

const notifier = updateNotifier({
  pkg,
  updateCheckInterval: updateCheckInterval,
  shouldNotifyInNpmScript: true,
});

notifier.notify();

cli.parse();
