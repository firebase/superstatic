/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var superstatic = require('../../');
var connect = require('connect');

var spec = {
  config: {
    root: './app',
    routes: {
      '**': 'index.html'
    }
  },
  cwd: process.cwd()
};

var app = connect()
  .use(superstatic(spec))

app.listen(3474, function (err) {
  
  console.log('Superstatic now serving on port 3474 ...');
});