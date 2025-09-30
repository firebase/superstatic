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

let RE2;
const minimatch = require("minimatch");
try {
  RE2 = require("re2");
} catch (er) {
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
 * @param {string} path The URL path from the request.
 * @param {object} config A dictionary from a sanitized JSON configuration.
 * @returns {boolean} Whether the config should be applied to the request.
 */
function configMatcher(path, config) {
  const glob = config.glob || config.source;
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
 * @param {string} pattern A regular expression pattern to test against.
 * @returns {RegExp} A regular expression object, created by either base
 *                  RegExp or RE2, which matches the RegExp prototype
 */
function createRaw(pattern) {
  return RE2 ? new RE2(pattern, "u") : new RegExp(pattern, "u");
}

/**
 * Returns true if RE2, which is an optional dependency, has been loaded.
 * @returns {boolean}
 */
function re2Available() {
  return RE2 ? true : false;
}

/**
 * Is truthy if the provided raw string pattern contains a RE2 named capture
 * group opening, ?P<, which is not interpretable when Superstatic is falling
 * back on the base Javascript RegExp implementation.
 * @param {string} pattern
 * @returns {boolean}
 */
function containsRE2Capture(pattern) {
  return pattern && pattern.includes("?P<");
}

/**
 * Is truthy if the provided raw string pattern contains a PCRE named capture
 * group opening, ?<, which is not interpretable when Superstatic has loaded
 * the RE2 bindings.
 * @param {string} pattern
 * @returns {boolean}
 */
function containsPCRECapture(pattern) {
  return pattern && pattern.includes("?<");
}

module.exports = {
  configMatcher: configMatcher,
  createRaw: createRaw,
  re2Available: re2Available,
  containsRE2Capture: containsRE2Capture,
  containsPCRECapture: containsPCRECapture,
};
