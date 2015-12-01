/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var middleware = require('./middleware');
var _ = require('lodash');
var promiseback = require('./utils/promiseback');
var RSVP = require('rsvp');

var Activator = function(spec, provider) {
  this.spec = spec;
  this.provider = provider;
  this.stack = this.buildStack();

  if (_.isFunction(spec.config)) {
    this.awaitConfig = spec.config;
  } else {
    this.awaitConfig = function() {
      return RSVP.resolve(spec.config);
    };
  }
};

Activator.prototype.buildStack = function() {
  var self = this;

  var stack = this.spec.stack.slice(0);
  _.forEach(this.spec.before, function(wares, name) {
    stack.splice.apply(stack, [stack.indexOf(name), 0].concat(wares));
  });

  _.forEach(this.spec.after, function(wares, name) {
    stack.splice.apply(stack, [stack.indexOf(name) + 1, 0].concat(wares));
  });

  return stack.map(function(ware) {
    return _.isFunction(ware) ? ware : middleware[ware](self.spec);
  });
};

Activator.prototype.build = function() {
  var self = this;

  return function(req, res, next) {
    promiseback(self.awaitConfig, 2)(req, res).then(function(config) {
      req.superstatic = config || {};

      var stack = self.stack.slice(0).reverse();
      var _run = function() {
        if (!stack.length) {
          return next();
        }
        var fn = stack.pop();
        return fn(req, res, _run);
      };

      _run();
    }, next);
  };
};

module.exports = function(spec, provider) {
  return new Activator(spec, provider).build();
};
