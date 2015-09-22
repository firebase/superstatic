/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var basicAuth = require('basic-auth-connect');
var cacheControl = require('cache-control');
var jfig = require('jfig');
var middleware = require('./middleware');
var _ = require('lodash');

var ENV = '.env.json';

module.exports = function(spec, provider, router) {
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
      config.error_page = config.error_page || '/404.html';

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

      // Remove trailing slash
      // stack.push(middleware.slashify({
      //   config: {trailing_slash: config.trailing_slash},
      //   provider: provider
      // }));

      // Cache control
      if (config.cache_control) {
        stack.push(cacheControl(config.cache_control));
      }

      // Clean urls
      if (config.clean_urls) {
        stack.push(middleware.cleanUrls({
          rules: config.clean_urls,
          provider: provider
        }));
      }

      // TODO: move this above router
      // Static files
      stack.push(middleware.static({
        error_page: config.error_page
      }));

      // Environment variables
      var env = jfig(spec.env || config.env || ENV, {
        root: process.cwd()
      });
      stack.push(middleware.env({data: env}));

      // Static router
      stack.push(middleware.staticRouter({
        rewrites: config.rewrites || config.routes
      }));

      stack.push(middleware.customNotFound({
        error_page: config.error_page,
        headers: config.headers
      }));

      var runStack = function(req, res, next) {
        var cur = stack.shift();
        if (!cur) { return next(); }
        cur(req, res, function() {
          runStack(req, res, next);
        });
      };

      runStack(req, res, next);
    });
  };
};
