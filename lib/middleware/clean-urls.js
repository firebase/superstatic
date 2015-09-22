/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var path = require('path');

var find = require('lodash').find;
var join = require('join-path');
var qs = require('querystring');
var url = require('fast-url-parser');
var mime = require('mime-types');
var booly = require('booly');
var minimatch = require('minimatch');
var asArray = require('as-array');
var slasher = require('glob-slasher');

module.exports = function (imports) {

  var rules = imports.rules || true;
  var provider = imports.provider;
  var indexFile = 'index.html';

  return function (req, res, next) {

    var pathname = url.parse(req.url).pathname;

    if (pathname === '/') {
      return next();
    }

    // i.e. /file.html
    if (path.extname(pathname) === '.html' && pathMatchesRules(pathname, rules)) {
      return redirectAsCleanUrl(req, res);
    }

    // i.e. /some-directory/index
    if(isDirectoryIndexFile(pathname, indexFile) && pathMatchesRules(pathname, rules)) {
      return redirectAsCleanUrl(req, res);
    }

    // Serving a directory index file
    directoryHasIndexFile(pathname, indexFile, function(hasIndexFile) {
      if (hasIndexFile) {
        pathname = join(pathname, indexFile);
      } else {
        pathname = pathname + '.html';
      }

      res.__.sendFile(pathname)
        .on('error', function (err) {
          next();
        });
    });
  };

  function redirectAsCleanUrl (req, res) {

    var pathname = url.parse(req.url).pathname;
    var query = qs.stringify(req.query);

    var redirectUrl = (isDirectoryIndexFile(pathname, 'index.html'))
      ? path.dirname(pathname)
      : join(path.sep, path.dirname(pathname), path.basename(pathname.split('?')[0], '.html'));

    redirectUrl += (query) ? '?' + query : '';
    res.__.redirect(redirectUrl);
  }

  function directoryHasIndexFile (pathname, indexFile, callback) {

    provider.exists(join(pathname, indexFile), callback);
  }

  function isDirectoryIndexFile (pathname, index) {

    var paths = pathname.split('/');
    return (paths[paths.length - 1]) === index
      || (paths[paths.length - 1]) === index.split('.')[0];
  }

  function pathMatchesRules(pathname, rules) {

    if (typeof booly(rules) === 'boolean' && booly(rules) === true) {
      rules = '**';
    }

    return !!find(asArray(slasher(rules), true), function (rule) {
      return minimatch(pathname, rule);
    });
  }
};
