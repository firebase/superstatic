/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var _ = require('lodash');
var Router = require('router');
var send = require('send');

var fsProvider = require('./fsProvider');
var Responder = require('./responder');
var activator = require('./activator');
var static = require('./middleware/static');

var loadConfigFile = require('./loaders/config-file');

var FAVICON_PATH = __dirname + '/assets/favicon.ico';
var INDEX_FILE = 'index.html';
var CWD = process.cwd();

module.exports = function (spec) {
  spec = spec || {};
  var router = Router();
  var cwd = spec.cwd || CWD;

  // Load data
  var config = spec.config = loadConfigFile(spec.config);

  // Set up provider
  var provider = spec.provider || fsProvider(_.extend({
    cwd: cwd // default current working directory
  }, config));


  // Setup helpers
  router.use(function (req, res, next) {
    res.responder = new Responder(req, res, {
      provider: provider,
      config: config
    });

    next();
  });

  router.use(activator(spec, provider, router));

  // Remove response helpers
  router.use(function (req, res, next) {
    res.__ = undefined;
    next();
  });

  return router;
};
