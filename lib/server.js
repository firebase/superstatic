/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var _ = require('lodash');
var connect = require('connect');
var networkLogger = require('morgan');
var compression = require('compression');

var superstatic = require('./superstatic');
var notFound = require('./middleware/not-found');
var loadServices = require('./loaders/services');
var reloader = require('./utils/reloader');

var DEFAULT_ERROR_PAGE = __dirname + '/assets/not_found.html';

module.exports = function (spec) {
  
  spec = spec || {};
  
  var defaultErrorPage = spec.errorPage || DEFAULT_ERROR_PAGE;
  var app = connect();
  var listen = app.listen.bind(app);
  
  // Override method because port and host are given
  // in the spec object
  app.listen = function (done) {
    
    var server = {};
    
    // TODO: test this
    // Install and load all services according
    // to config file
    loadServices(spec, function (err, appServices) {
      
      if (err) {
        throw err;
      }
      
      // TODO: Test this??
      spec.services = _.extend(appServices, spec.services);
      
      // Start Live Reload server
      if (spec.live) {
        reloader({app: app});
      }
      
      app.use(superstatic(spec));
      
      // Handle not found pages
      app.use(notFound({
        file: defaultErrorPage
      }));
      
      // Start server
      server = listen(spec.port, spec.hostname || spec.host, done);
    });
    
    return server;
  };
  
  // Console output for network requests
  if (spec.debug) {
    app.use(networkLogger('combined'));
  }
  
  // http compression
  if (spec.gzip) {
    app.use(compression());
  }
  
  return app;
};