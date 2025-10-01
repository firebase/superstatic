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

const middleware = require("./middleware");
const _ = require("lodash");
const promiseback = require("./utils/promiseback");

const Activator = function (spec, provider) {
  this.spec = spec;
  this.provider = provider;
  this.stack = this.buildStack();

  if (_.isFunction(spec.config)) {
    this.awaitConfig = spec.config;
  } else {
    this.awaitConfig = function () {
      return Promise.resolve(spec.config);
    };
  }
};

Activator.prototype.buildStack = function () {
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

Activator.prototype.build = function () {
  const self = this;

  return function (req, res, next) {
    promiseback(self.awaitConfig, 2)(req, res).then((config) => {
      req.superstatic = config ?? {};

      const stack = self.stack.slice(0).reverse();
      const _run = function () {
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

module.exports = function (spec, provider) {
  return new Activator(spec, provider).build();
};
