/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var format = require('chalk');
var print = require('pretty-print');

var loadConfigFile = require('./config-file');
var globalInstall = require('../utils/global-install');
var globalResolve = require('../utils/global-resolve');

// TODO: test all of this

var SERVICES = [
  'forms',
  'proxy',
  'prerender'
];

module.exports = function loadServices (spec, done) {
  
  var config = loadConfigFile(spec.config);
  var missingServices = [];
  var services = {};
  
  SERVICES
    .filter(function (name) {
    
      return config.hasOwnProperty(name);
    }).map(function (name) {
      
      return 'superstatic-' + name;
    })
    .forEach(function (name) {
      
      var fn = globalResolve(name);
      
      if (!fn) {
        missingServices.push(name);
      }
      else {
        services[name.replace('superstatic-', '')] = fn(); // Assign instantiated middleware
      }
    });
    
  // Install missing services
  if (missingServices.length) {
    
    console.log('\n' + format.white.bgBlue(' Hey! '));
    console.log('\nThe following Superstatic services aren\'t installed:\n');
    print(missingServices, {
      leftPadding: 2
    });
    console.log('\nThey must be installed in order for you to use them locally.');
    console.log('Installing for you now ...');
    
    globalInstall(missingServices, function (err) {
      
      // Add installed services to list
      missingServices.forEach(function (name) {
        
        var fn = globalResolve(name);
        
        if (!fn) {
          return;
        }
        
        services[name.replace('superstatic-', '')] = fn();
      });
      
      console.log('\n' + format.green.bold('Success!'));
      done(err, services);
    });
  }
  else {
    done(null, services);
  }
};