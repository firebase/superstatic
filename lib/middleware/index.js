/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


exports.services = require('./services');
exports.slashify = require('./slashify');
exports.cleanUrls = require('./clean-urls');
exports.env = require('./env');
exports.static = require('./static');
exports.staticRouter = require('./static-router');
exports.customNotFound = require('./custom-not-found');
exports.notFound = require('./not-found');
exports.finalHandler = require('./final-handler');
exports.setHeaders = require('./set-headers');
exports.redirects = require('./redirects');
