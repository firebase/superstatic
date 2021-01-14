/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
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

const superstatic = function(spec) {
  spec = _.assign(
    {
      stack: "default"
    },
    spec
  );

  if (!_.has(spec, "fallthrough")) {
    spec.fallthrough = true;
  }

  if (_.isString(spec.stack) && _.has(superstatic.stacks, spec.stack)) {
    spec.stack = superstatic.stacks[spec.stack];
  }

  const router = makerouter();
  const cwd = spec.cwd || CWD;

  // Load data
  const config = (spec.config = loadConfigFile(spec.config));
  config.errorPage = config.errorPage || "/404.html";

  // Set up provider
  const provider = spec.provider
    ? promiseback(spec.provider, 2)
    : fsProvider(
        _.extend(
          {
            cwd: cwd // default current working directory
          },
          config
        )
      );

  // Select compression middleware
  let compressor;
  if (_.isFunction(spec.compression)) {
    compressor = spec.compression;
  } else if (spec.compression || spec.gzip) {
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
      rewriters: spec.rewriters
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
    "missing"
  ],
  strict: ["redirects", "headers", "files", "rewrites", "missing"]
};

module.exports = superstatic;
