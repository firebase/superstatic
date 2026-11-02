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
import * as path from "node:path";

import { Configuration } from "../config";
import { isPlainObject } from "../utils/objectutils";

const CONFIG_FILE = ["superstatic.json", "firebase.json"];

type ConfigLoaderFn = (...args: never) => unknown;

/**
 * Loads Superstatic configuration from a file path, candidate file list, JSON
 * string, configuration object, or loader function.
 * @param filename config source or loader function.
 * @returns resolved configuration object, or the loader function unchanged.
 */
function loadConfigFile<T extends ConfigLoaderFn>(filename: T): T;
function loadConfigFile(
  filename?: string | string[] | Configuration | Record<string, unknown> | null,
): Configuration;
function loadConfigFile<T extends ConfigLoaderFn>(
  filename:
    | string
    | string[]
    | Configuration
    | Record<string, unknown>
    | T
    | null
    | undefined,
): Configuration | T;
function loadConfigFile(
  filename?:
    | string
    | string[]
    | Configuration
    | Record<string, unknown>
    | ConfigLoaderFn
    | null,
): Configuration | ConfigLoaderFn {
  if (typeof filename === "function") {
    return filename;
  }

  let configObject: Record<string, unknown> = {};
  let candidateFiles: string | string[] | undefined;

  if (typeof filename === "string") {
    configObject = parseJsonObject(filename);
    candidateFiles = filename;
  } else if (isPlainObject(filename)) {
    configObject = filename;
    candidateFiles = CONFIG_FILE;
  } else if (Array.isArray(filename)) {
    candidateFiles = filename;
  } else {
    candidateFiles = CONFIG_FILE;
  }

  const resolvedFilename = Array.isArray(candidateFiles)
    ? candidateFiles.find((name) =>
        fs.existsSync(path.join(process.cwd(), name)),
      )
    : candidateFiles;

  let config: Record<string, unknown> = {};

  if (resolvedFilename?.endsWith("json")) {
    try {
      const raw = fs.readFileSync(path.resolve(resolvedFilename), "utf8");
      const parsed = parseJsonObject(raw);
      config = isPlainObject(parsed.hosting) ? parsed.hosting : parsed;
    } catch {
      // do nothing
    }
  }

  return { ...config, ...configObject };
}

/**
 * Parses a JSON string into a plain object, returning an empty object when
 * parsing fails or the JSON value is not a plain object.
 * @param raw JSON string to parse.
 * @returns parsed plain object, or an empty object.
 */
function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isPlainObject(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON.
  }
  return {};
}

export = loadConfigFile;
