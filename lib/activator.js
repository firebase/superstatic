/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var basicAuth = require('basic-auth-connect');
var cacheControl = require('cache-control');
var jfig = require('jfig');
var middleware = require('./middleware');
var _ = require('lodash');

var ENV = '.env.json';

module.exports = function(spec, provider) {
  var awaitConfig;
  spec = spec || {};

  if (_.isFunction(spec.config)) {
    awaitConfig = spec.config;
  } else {
    awaitConfig = function(req, res, ready) {
      ready(spec.config);
    };
  }

  return function(req, res, next) {
    awaitConfig(req, res, function(config) {
      var stack = [];
      config.errorPage = config.errorPage || '/404.html';

      // Protect
      if (spec.protect || config.protect) {
        stack.push(basicAuth.apply(basicAuth, (spec.protect || config.protect).split(':')));
      }

      // Services
      if (spec.services) {
        stack.push(middleware.services(spec));
      }

      // Redirects
      if (config.redirects) {
        stack.push(middleware.redirects(config.redirects));
      }

      // Headers
      if (config.headers) {
        stack.push(middleware.setHeaders(config.headers));
      }

      // Cache control
      if (config.cacheControl) {
        stack.push(cacheControl(config.cacheControl));
      }

      // Clean urls
      if (config.cleanUrls) {
        stack.push(middleware.cleanUrls({
          rules: config.cleanUrls || config.cleanUrls,
          provider: provider
        }));
      }

      // Environment variables
      var env = jfig(spec.env || config.env || ENV, {
        public: process.cwd()
      });
      stack.push(middleware.env({data: env}));

      // Static files
      stack.push(middleware.static({
        trailingSlash: config.trailingSlash
      }));

      // Static router
      stack.push(middleware.staticRouter({
        rewrites: config.rewrites
      }));

      stack.push(middleware.customNotFound({
        errorPage: config.errorPage,
        headers: config.headers
      }));

      var runStack = function() {
        var cur = stack.shift();
        if (!cur) { return next(); }
        cur(req, res, function() {
          runStack(req, res, next);
        });
      };

      runStack();
    });
  };
};
