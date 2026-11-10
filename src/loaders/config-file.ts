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
import type { IncomingMessage, ServerResponse } from "node:http";
import * as path from "node:path";

import { Configuration } from "../config";
import { isPlainObject } from "../utils/objectutils";

const CONFIG_FILE = ["superstatic.json", "firebase.json"];

type ConfigLoaderFn = (
  req: IncomingMessage,
  res: ServerResponse,
) => Configuration | Promise<Configuration>;

/**
 * Loads Superstatic configuration from a file path, candidate file list, JSON
 * string, configuration object, or loader function.
 * @param filename config source or loader function.
 * @param autoConfig whether to discover default config files.
 * @returns resolved configuration object, or the loader function unchanged.
 */
function loadConfigFile<T extends ConfigLoaderFn>(
  filename: T,
  autoConfig?: boolean,
): T;
function loadConfigFile(
  filename?: string | string[] | Configuration | null,
  autoConfig?: boolean,
): Configuration;
function loadConfigFile<T extends ConfigLoaderFn = ConfigLoaderFn>(
  filename?: string | string[] | Configuration | T | null,
  autoConfig?: boolean,
): Configuration | T;
function loadConfigFile(
  filename?:
    | string
    | string[]
    | Configuration
    | Record<string, unknown>
    | ConfigLoaderFn
    | null,
  autoConfig = true,
): Configuration | ConfigLoaderFn {
  if (typeof filename === "function") {
    return filename;
  }

  let configObject: Record<string, unknown> = {};
  let candidateFiles: string | string[] | undefined = autoConfig ? CONFIG_FILE : [];

  if (typeof filename === "string") {
    const parsed = parseJsonObject(filename);
    if (parsed !== undefined) {
      configObject = parsed;
    } else {
      candidateFiles = filename;
    }
  } else if (isPlainObject(filename)) {
    configObject = filename;
  } else if (Array.isArray(filename)) {
    candidateFiles = filename;
  }

  const resolvedFilename = Array.isArray(candidateFiles)
    ? candidateFiles.find((name) => fs.existsSync(path.resolve(name)))
    : candidateFiles;

  let config: Record<string, unknown> = {};

  if (resolvedFilename?.endsWith("json")) {
    try {
      const raw = fs.readFileSync(path.resolve(resolvedFilename), "utf8");
      const parsed = parseJsonObject(raw);
      if (parsed) {
        if ("hosting" in parsed) {
          config = isPlainObject(parsed.hosting) ? parsed.hosting : {};
        } else {
          config = parsed;
        }
      }
    } catch {
      // do nothing
    }
  }

  return { ...config, ...configObject };
}

/**
 * Parses a JSON string into a plain object, returning `undefined` when
 * parsing fails or the JSON value is not a plain object.
 * @param raw JSON string to parse.
 * @returns parsed plain object, or `undefined`.
 */
function parseJsonObject(raw: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isPlainObject(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore invalid JSON.
  }
  return undefined;
}

export = loadConfigFile;
