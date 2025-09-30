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

const _ = require("lodash");
const makerouter = require("router");

const fsProvider = require("./providers/fs");
const Responder = require("./responder");
const activator = require("./activator");
const notFound = require("./middleware/missing");

const promiseback = require("./utils/promiseback");
const loadConfigFile = require("./loaders/config-file");
const defaultCompressor = require("compression")();

const CWD = process.cwd();

/**
 * Superstatic returns a router that can be used in a server.
 * @param {MiddlewareOptions} spec superstatic options.
 * @returns {HandleFunction} router handler.
 */
const superstatic = function (spec = {}) {
  spec.stack ??= "default";

  spec.fallthrough ??= true;

  if (typeof spec.stack === "string" && superstatic.stacks[spec.stack]) {
    spec.stack = superstatic.stacks[spec.stack];
  }

  const router = makerouter();
  const cwd = spec.cwd ?? CWD;

  // Load data
  /** @type {Configuration} */
  const config = (spec.config = loadConfigFile(spec.config));
  config.errorPage = config.errorPage ?? "/404.html";

  // Set up provider
  const provider = spec.provider
    ? promiseback(spec.provider, 2)
    : fsProvider(
        _.extend(
          {
            cwd: cwd, // default current working directory
          },
          config,
        ),
      );

  // Select compression middleware
  let compressor;
  if (_.isFunction(spec.compression)) {
    compressor = spec.compression;
  } else if (spec.compression ?? spec.gzip) {
    compressor = defaultCompressor;
  } else {
    compressor = null;
  }

  // Setup helpers
  router.use((req, res, next) => {
    res.superstatic = new Responder(req, res, {
      provider: provider,
      config: config,
      compressor: compressor,
      rewriters: spec.rewriters,
    });

    next();
  });

  router.use(activator(spec, provider));

  // Handle not found pages
  if (!spec.fallthrough) {
    router.use(notFound(spec));
  }

  return router;
};

superstatic.stacks = {
  default: [
    "protect",
    "redirects",
    "headers",
    "env",
    "files",
    "rewrites",
    "missing",
  ],
  strict: ["redirects", "headers", "files", "rewrites", "missing"],
};

module.exports = superstatic;
