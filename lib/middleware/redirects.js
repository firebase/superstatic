/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var isObject = require('lodash').isObject;
var isArray = require('lodash').isArray;
var isUrl = require('is-url');

var minimatch = require('minimatch');
var pathToRegexp = require('path-to-regexp');
var slasher = require('glob-slasher');

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
  if (this.capture) match = this.capture.exec(url);
  if (match) {
    var params = {};
    for (var i = 0; i < this.captureKeys.length; i++) {
      params[this.captureKeys[i].name] = match[i + 1];
    }

    return {
      type: this.type,
      destination: this.compileDestination(params)
    };
  } else if (minimatch(url,this.source)) {
    return {
      type: this.type,
      destination: this.destination
    };
  }
};

module.exports = function (config) {
  var redirects = [];
  if (isArray(config)) {
    config.forEach(function(redir) {
      redirects.push(new Redirect(redir.source, redir.destination, redir.type));
    });
  } else if (isObject(config)) {
    // handle legacy object map format
    for (var source in config) {
      if (isObject(config[source])) {
        redirects.push(
          new Redirect(source, config[source].url, config[source].status)
        );
      } else {
        redirects.push(new Redirect(source,config[source],301));
      }
    }
  } else {
    throw new Error("Redirects provided in an unrecognized format");
  }

  var matcher = function(url) {
    for (var i = 0; i < redirects.length; i++) {
      var result = redirects[i].test(url);
      if (result) return result;
    }
  };

  return function (req, res, next) {
    var match = matcher(req.url);

    if (!match) {
      return next();
    }

    // Remove leading slash of a url
    var redirectUrl = formatExternalUrl(match.destination);

    res.writeHead(match.type, {Location: redirectUrl});
    res.end();
  };
};

function formatExternalUrl (u) {

  var cleaned = u
    .replace('/http:/', 'http://')
    .replace('/https:/', 'https://');

  return (isUrl(cleaned)) ? cleaned : u;
}
