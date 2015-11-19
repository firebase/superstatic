/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var jfig = require('jfig');
var middleware = require('./middleware');
var _ = require('lodash');
var promiseback = require('./utils/promiseback');
var RSVP = require('rsvp');

var ENV = '.env.json';

var Activator = function(spec, provider) {
  this.spec = spec;
  this.provider = provider;

  if (_.isFunction(spec.config)) {
    this.awaitConfig = spec.config;
  } else {
    this.awaitConfig = function() {
      return RSVP.resolve(spec.config);
    };
  }
};

Activator.prototype.runStack = function(wares, config, req, res, next, cursor) {
  var self = this;
  cursor = cursor || 0;
  var nxt;
  if (cursor === wares.length - 1) {
    nxt = next;
  } else {
    nxt = function(rq, rs, nx) {
      self.runStack(wares, config, rq, rs, nx, cursor + 1);
    };
  }
  return wares[cursor](self.spec, config)(req, res, nxt);
};

Activator.prototype.build = function() {
  var self = this;
  var wares = [];
  this.stack.forEach(function(name) {
    self.addBefores(wares, name);
    wares.push(middleware[name]);
    self.addAfters(wares, name);
  });

  return function(req, res, next) {
    promiseback(req, res, self.awaitConfig).then(function(config) {
      config.errorPage = config.errorPage || '/404.html';

      self.runStack(wares, config, req, res, next);
    }, next);
  };
};

module.exports = function(spec, provider) {
  return new Activator(spec, provider).build();
};

module.exports = function(spec, provider) {
  var awaitConfig;
  spec = spec || {};

  if (_.isFunction(spec.config)) {
    awaitConfig = spec.config;
  } else {
    awaitConfig = function() {
      return RSVP.resolve(_.assign({}, spec.config));
    };
  }

  return function(req, res, next) {
    promiseback(req, res, awaitConfig).then(function(config) {
      var stack = [];

      // Headers
      if (config.headers) {
        stack.push(middleware.setHeaders(config.headers));
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
    }).catch(next);
  };
};
