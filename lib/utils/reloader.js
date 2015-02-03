var tinylr = require('tiny-lr');
var liveReload = require('connect-livereload');
var gaze = require('gaze');
var format = require('chalk');

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
    
    gaze(process.cwd() + '/**/*.*', function (err, watcher) {
      
      this.on('changed', function (filepath) {
        
        console.log('[Livereload] %s changed. Updating page.', filepath); 
        
        tinylr.changed(filepath);
      });
    });
  });
  
  // Middleware injects livereload.js script
  app.use(liveReload({
    port: port,
  }));
};