/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var _ = require('lodash');
var makerouter = require('router');

var fsProvider = require('./providers/fs');
var Responder = require('./responder');
var activator = require('./activator');
var notFound = require('./middleware/not-found');

var loadConfigFile = require('./loaders/config-file');

var CWD = process.cwd();
var DEFAULT_ERROR_PAGE = __dirname + '/assets/not_found.html';

module.exports = function(spec) {
  spec = spec || {};
  if (!_.has(spec, 'fallthrough')) {
    spec.fallthrough = true;
  }

  var router = makerouter();
  var cwd = spec.cwd || CWD;

  // Load data
  var config = spec.config = loadConfigFile(spec.config);
  config.errorPage = config.errorPage || '/404.html';

  // Set up provider
  var provider = spec.provider || fsProvider(_.extend({
    cwd: cwd // default current working directory
  }, config));

  // Setup helpers
  router.use(function(req, res, next) {
    res._responder = new Responder(req, res, {
      provider: provider,
      config: config,
      gzip: spec.gzip
    });
    res._superstatic = {};

    next();
  });

  router.use(activator(spec, provider, router));

  // Handle not found pages
  if (!spec.fallthrough) {
    var defaultErrorPage = spec.errorPage || DEFAULT_ERROR_PAGE;
    router.use(notFound({
      file: defaultErrorPage
    }));
  }

  return router;
};
