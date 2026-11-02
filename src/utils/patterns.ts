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

import { minimatch } from "minimatch";
import { createRequire } from "node:module";
import type RE2Type from "re2";

import { Matcher } from "../config";

let RE2: typeof RE2Type | null;
try {
  const requireModule: (id: string) => unknown = createRequire(__filename);
  const re2Module = requireModule("re2");
  // Cast is required because createRequire returns untyped NodeJS.Require at runtime.
  RE2 = typeof re2Module === "function" ? (re2Module as typeof RE2Type) : null;
} catch {
  RE2 = null;
}

/**
 * Evaluates whether a configured redirect/rewrite/custom header should
 * be applied to a request against a specific path. All three features
 * are configured with a hash that contains either a Node-like glob path
 * specification as its `source` or `glob` field, or a RE2 regular
 * expression as its `regex` field.
 *
 * Since Javascript lacks a native library for RE2, Superstatic uses the C
 * bindings as an optional dependency, and falls over to PCRE if the import
 * is unavailable. Under most circumstances not involving named capturing
 * groups, the two libraries should have identical behavior.
 *
 * No special consideration is taken if the configuration hash contains both
 * a glob and a regex. normalizeConfig() will error in that case.
 * @param path The URL path from the request.
 * @param config A dictionary from a sanitized JSON configuration.
 * @returns Whether the config should be applied to the request.
 */
export function configMatcher(path: string, config: Matcher): boolean {
  const glob = config.glob ?? config.source;
  const regex = config.regex;
  if (glob) {
    return minimatch(path, glob);
  }
  if (regex) {
    const pattern = RE2 ? new RE2(regex, "u") : new RegExp(regex, "u");
    return path.match(pattern) !== null;
  }
  return false;
}

/**
 * Creates either an RE2 or a Javascript RegExp from a provided string
 * pattern, depending on whether or not the RE2 library is available as an
 * import.
 * @param pattern A regular expression pattern to test against.
 * @returns A regular expression object, created by either base
 *                  RegExp or RE2, which matches the RegExp prototype.
 */
export function createRaw(pattern: string): RegExp {
  return RE2 ? new RE2(pattern, "u") : new RegExp(pattern, "u");
}

/**
 * Returns true if RE2, which is an optional dependency, has been loaded.
 * @returns Whether RE2 bindings are available.
 */
export function re2Available(): boolean {
  return RE2 !== null;
}

/**
 * Checks whether the provided raw string pattern contains a RE2 named capture
 * group opening, ?P<, which is not interpretable when Superstatic is falling
 * back on the base Javascript RegExp implementation.
 * @param pattern A regular expression pattern string.
 * @returns Whether the pattern contains a RE2 named capture group opening.
 */
export function containsRE2Capture(pattern?: string): boolean {
  return pattern?.includes("?P<") ?? false;
}

/**
 * Checks whether the provided raw string pattern contains a PCRE named capture
 * group opening, ?<, which is not interpretable when Superstatic has loaded
 * the RE2 bindings.
 * @param pattern A regular expression pattern string.
 * @returns Whether the pattern contains a PCRE named capture group opening.
 */
export function containsPCRECapture(pattern?: string): boolean {
  return pattern?.includes("?<") ?? false;
}
