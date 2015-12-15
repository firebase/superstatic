/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var superstatic = require('../../lib/server');

var spec = {
  port: 3474,
  config: {
    public: './app'
  },
  cwd: __dirname,
  errorPage: __dirname + '/error.html',
  gzip: true,
  debug: true
};

var app = superstatic(spec);
app.listen(function(err) {
  if (err) { console.log(err); }
  console.log('Superstatic now serving on port 3474 ...');
});
