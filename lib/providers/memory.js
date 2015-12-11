/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var crypto = require('crypto');
var RSVP = require('rsvp');
var Readable = require('stream').Readable;

module.exports = function(options) {
  var fn = function(req, pathname) {
    pathname = decodeURI(pathname);

    if (!options.store[pathname]) {
      return RSVP.resolve(null);
    }

    var content = options.store[pathname];

    var stream = new Readable();
    stream.push(content);
    stream.push(null);

    var hash = crypto.createHash('md5');
    hash.update(content);

    return RSVP.resolve({
      modified: options.modified || null,
      stream: stream,
      size: content.length,
      etag: hash.digest('hex')
    });
  };
  fn.store = options.store || {};
  return fn;
};
