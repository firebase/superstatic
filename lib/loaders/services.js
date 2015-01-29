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
  
  SERVICES
    .filter(function (name) {
    
      return config.hasOwnProperty(name);
    })
    .map(function (name) {
      
      return 'superstatic-' + name;
    })
    .forEach(function (name) {
      
      if (!globalResolve(name)) {
        missingServices.push(name);
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
      
      console.log('\n' + format.green.bold('Success!'));
      done(err);
    });
  }
  else {
    done();
  }
};