/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var tinylr = require('tiny-lr');
var liveReload = require('connect-livereload');
var format = require('chalk');
var chokidar = require('chokidar');

// TODO: test this

module.exports = function reloader (options) {
  
  if (!options.app || !options.app.use) {
    throw new Error('HTTP middleware app value required');
  }
  
  var app = options.app;
  var port = options.port || 35729;
  
  // Start live reload server
  tinylr().listen(port, function() {
    
    console.log('\n== Livereload listening on port %s. ==', port);
    
    var watcher = chokidar.watch(process.cwd() + '/**/*.*');
    
    watcher.on('change', function (filepath) {
        
      console.log('[Livereload] %s changed. Updating page.', filepath); 
      tinylr.changed(filepath);
    });
  });
  
  // Middleware injects livereload.js script
  app.use(liveReload({
    port: port,
  }));
};