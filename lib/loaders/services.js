var _ = require('lodash');
var join = require('join-path');
var tryRequire = require('try-require');
var exec = require('exec');

var loadConfigFile = require('./config-file');

// TODO: test all of this

var SERVICES = [
  'forms',
  'proxy',
  'prerender'
];

module.exports = function (spec, done) {
  
  var config = loadConfigFile(spec.config);
  
  _(SERVICES)
    .filter(function (name) {
    
      return config.hasOwnProperty(name);
    })
    .map(function (name) {
      
      return 'superstatic-' + name;
    })
    .forEach(function (name) {
      
      var service = resolver(name);
    })
    .value();
  
  done();
};

function resolver (name) {
  
  // TODO: continue here!!!!!!!!!!!!!!!
  
  var service;
 
  var resolveFrom = require('resolve-from');
  process.env.PATH.split(':').forEach(function (p) {
    
    if (!service) {
      try {
        service = resolveFrom(_.initial(p.split('/')).join('/') + '/lib', name);
      }
      catch (e) {}
      
      if (!service) {
        try {
          service = resolveFrom(_.initial(p.split('/')).join('/'), name);
        }
        catch (e) {}
      }
      
      console.log(service);
    }
  });
   
  // var npmconf = require('npmconf');
  // npmconf.load({g: true}, function (err, conf) {
    
  //   var service;
  //   var prefix = conf.get('prefix');
    
  //   var service = resolveFrom(prefix + '/lib', name);
    
    
    
  //   // Local require
  //   service = tryRequire(name);
    
  //   // Global require
  //   if (!service) {
  //     service = tryRequire(join(prefix, 'lib', 'node_modules', name));
  //   }
  // });
}

// try to find the most reasonable prefix to use

var fs = require("fs")
var path = require("path")

function findPrefix (p, cb_) {
  function cb (er, p) {
    process.nextTick(function () {
      cb_(er, p)
    })
  }

  p = path.resolve(p)
  // if there's no node_modules folder, then
  // walk up until we hopefully find one.
  // if none anywhere, then use cwd.
  var walkedUp = false
  while (path.basename(p) === "node_modules") {
    p = path.dirname(p)
    walkedUp = true
  }
  if (walkedUp) return cb(null, p)

  findPrefix_(p, p, cb)
}

function findPrefix_ (p, original, cb) {
  if (p === "/"
      || (process.platform === "win32" && p.match(/^[a-zA-Z]:(\\|\/)?$/))) {
    return cb(null, original)
  }
  fs.readdir(p, function (er, files) {
    // an error right away is a bad sign.
    // unless the prefix was simply a non
    // existent directory.
    if (er && p === original) {
      if (er.code === "ENOENT") return cb(null, original);
      return cb(er)
    }

    // walked up too high or something.
    if (er) return cb(null, original)

    if (files.indexOf("node_modules") !== -1
        || files.indexOf("package.json") !== -1) {
      return cb(null, p)
    }

    var d = path.dirname(p)
    if (d === p) return cb(null, original)

    return findPrefix_(d, original, cb)
  })
}

function globalRoot () {
  
  var dirs = process.argv[1].split('/');
  
  return _.take(dirs, dirs.length - 2).join('/');
}