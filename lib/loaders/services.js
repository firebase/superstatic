var _ = require('lodash');
var join = require('join-path');
var tryRequire = require('try-require');
var path = require('path');
var glob = require('glob');
var homeDir = require('home-dir');
var format = require('chalk');
var print = require('pretty-print');
var spawn = require('cross-spawn');
var async = require('async');
var spinner = require('char-spinner');

var loadConfigFile = require('./config-file');

// TODO: test all of this

var win32 = process.platform === 'win32'
var SERVICES = [
  'forms',
  'proxy',
  'prerender'
];

module.exports = function (spec, done) {
  
  var config = loadConfigFile(spec.config);
  var missingServices = [];
  
  _(SERVICES)
    .filter(function (name) {
    
      return config.hasOwnProperty(name);
    })
    .map(function (name) {
      
      return 'superstatic-' + name;
    })
    .forEach(function (name) {
      
      var service = resolver(name);
      
      if (!service) {
        missingServices.push(name);
      }
    })
    .value();
  
  // Install missing services
  if (missingServices.length) {
    
    console.log('\n' + format.white.bgBlue(' Hey! '));
    console.log('\nThe following Superstatic services aren\'t installed:\n');
    print(missingServices, {
      leftPadding: 2
    });
    console.log('\nThey must be installed in order for you to use them locally.');
    console.log('Installing for you now ...');
    
    installServices(missingServices, function (err) {
      
      console.log('\n' + format.green.bold('Success!'));
      done(err);
    });
  }
  else {
    done();
  }
};

function resolver (name) {
  
  var service;
  
  getNpmPaths().forEach(function (root) {
    
    if (!service) {
      var filepath = glob.sync(join(root, name))[0];
      service = tryRequire(filepath);
    }
  });
  
  return service;
}

function installServices (services, done) {
  
  var spinnerInterval = spinner({});
  
  async.each(services, function (serviceName, serviceInstalled) {
    
   spawn('npm', ['install', serviceName, '-g'])
    .on('close', serviceInstalled);
  }, function (err) {
    
    // Stop spinner and clear line
    clearInterval(spinnerInterval);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    done(err);
  });
}

function getNpmPaths () {
  var paths = [];

  // Walk up the CWD and add `node_modules/` folder lookup on each level
  process.cwd().split(path.sep).forEach(function (part, i, parts) {
    var lookup = path.join.apply(path, parts.slice(0, i + 1).concat(['node_modules']));

    if (!win32) {
      lookup = '/' + lookup;
    }

    paths.push(lookup);
  });

  // Adding global npm directories
  // We tried using npm to get the global modules path, but it haven't work out
  // because of bugs in the parseable implementation of `ls` command and mostly
  // performance issues. So, we go with our best bet for now.
  if (process.env.NODE_PATH) {
    paths = _.compact(process.env.NODE_PATH.split(path.delimiter)).concat(paths);
  } else {
    // global node_modules should be 5 directory up this one (most of the time)
    paths.push(path.join(__dirname, '../../../..'));

    // adds support for generator resolving when yeoman-generator has been linked
    paths.push(path.join(path.dirname(process.argv[1]), '../..'));

    // Default paths for each system
    if (win32) {
      paths.push(path.join(process.env.APPDATA, 'npm/node_modules'));
    } else {
      paths.push('/usr/lib/node_modules');
    }
  }
  
  // nvm on os x
  // For some reason, nvm doens't get put on NODE_PATH
  // unless you do it manually.
  if (!win32) {
    paths.push(homeDir('.nvm/*/lib/node_modules'));
  }
  
  return paths.reverse();
}