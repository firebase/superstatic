/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var isUrl = require('is-url');
var _ = require('lodash');

var minimatch = require('minimatch');
var pathToRegexp = require('path-to-regexp');
var slasher = require('glob-slasher');

function formatExternalUrl(u) {
  var cleaned = u
    .replace('/http:/', 'http://')
    .replace('/https:/', 'https://');

  return (isUrl(cleaned)) ? cleaned : u;
}

var Redirect = function(source, destination, type) {
  this.type = type || 301;
  this.source = slasher(source);
  this.destination = destination;

  if (this.destination.match(/(?:^|\/):/)) {
    this.captureKeys = [];
    this.capture = pathToRegexp(this.source, this.captureKeys);
    this.compileDestination = pathToRegexp.compile(this.destination);
  }
};

Redirect.prototype.test = function(url) {
  var match;
  if (this.capture) {
    match = this.capture.exec(url);
  }
  if (match) {
    var params = {};
    for (var i = 0; i < this.captureKeys.length; i++) {
      var m = match[i + 1];
      if (m && m.indexOf('/') >= 0) {
        m = m.split('/');
      }

      params[this.captureKeys[i].name] = m;
    }

    try {
      var dest = this.compileDestination(params);

      return {
        type: this.type,
        destination: dest
      };
    } catch (e) {
      return undefined;
    }
  } else if (minimatch(url, this.source)) {
    return {
      type: this.type,
      destination: this.destination
    };
  }
};

module.exports = function() {
  return function(req, res, next) {
    var config = _.get(req, 'superstatic.redirects');
    if (!config) {
      return next();
    }

    var redirects = [];
    if (_.isArray(config)) {
      config.forEach(function(redir) {
        redirects.push(new Redirect(redir.source, redir.destination, redir.type));
      });
    } else {
      throw new Error('redirects provided in an unrecognized format');
    }

    var matcher = function(url) {
      for (var i = 0; i < redirects.length; i++) {
        var result = redirects[i].test(url);
        if (result) { return result; }
      }
    };

    var match = matcher(req.url);

    if (!match) {
      return next();
    }

    // Remove leading slash of a url
    var redirectUrl = formatExternalUrl(match.destination);

    res.superstatic.handle({
      redirect: redirectUrl,
      status: match.type
    });
  };
};
