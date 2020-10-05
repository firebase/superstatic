/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const middleware = require("./middleware");
const _ = require("lodash");
const promiseback = require("./utils/promiseback");
const RSVP = require("rsvp");

const Activator = function(spec, provider) {
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
  const self = this;

  const stack = this.spec.stack.slice(0);
  _.forEach(this.spec.before, (wares, name) => {
    stack.splice(...[stack.indexOf(name), 0].concat(wares));
  });

  _.forEach(this.spec.after, (wares, name) => {
    stack.splice(...[stack.indexOf(name) + 1, 0].concat(wares));
  });

  return stack.map((ware) => {
    return _.isFunction(ware) ? ware : middleware[ware](self.spec);
  });
};

Activator.prototype.build = function() {
  const self = this;

  return function(req, res, next) {
    promiseback(self.awaitConfig, 2)(req, res).then((config) => {
      req.superstatic = config || {};

      const stack = self.stack.slice(0).reverse();
      const _run = function() {
        if (!stack.length) {
          return next();
        }
        const fn = stack.pop();
        return fn(req, res, _run);
      };

      _run();
    }, next);
  };
};

module.exports = function(spec, provider) {
  return new Activator(spec, provider).build();
};
