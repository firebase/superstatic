/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var path = require('path');

var find = require('lodash').find;
var join = require('join-path');
var qs = require('querystring');
var url = require('fast-url-parser');
var booly = require('booly');
var minimatch = require('minimatch');
var asArray = require('as-array');
var slasher = require('glob-slasher');
var pathutils = require('../utils/pathutils');
var _ = require('lodash');

function redirectAsCleanUrl(req, res) {
  var pathname = url.parse(req.url).pathname;
  var query = qs.stringify(req.query);

  var redirectUrl = (pathutils.isDirectoryIndex(pathname) || pathutils.isDirectoryIndex(pathname + '.html'))
    ? path.dirname(pathname)
    : join(path.sep, path.dirname(pathname), path.basename(pathname.split('?')[0], '.html'));

  redirectUrl += (query) ? '?' + query : '';
  return res._responder.handle({redirect: redirectUrl});
}

function pathMatchesRules(pathname, rules) {
  if (typeof booly(rules) === 'boolean' && booly(rules) === true) {
    rules = '**';
  }

  return !!find(asArray(slasher(rules), true), function(rule) {
    return minimatch(pathname, rule);
  });
}

module.exports = function() {
  return function(req, res, next) {
    var rules = _.get(req, 'superstatic.cleanUrls');

    if (!rules) {
      return next();
    }

    var pathname = url.parse(req.url).pathname;

    if (pathname === '/') {
      return next();
    }

    // i.e. /file.html
    if (path.extname(pathname) === '.html' && pathMatchesRules(pathname, rules)) {
      return redirectAsCleanUrl(req, res);
    }

    // i.e. /some-directory/index
    if (pathutils.isDirectoryIndex(pathname + '.html') && pathMatchesRules(pathname, rules)) {
      return redirectAsCleanUrl(req, res);
    }

    res._responder.handle([
      pathutils.asDirectoryIndex(pathname),
      pathname + '.html'
    ], next);
  };
};
