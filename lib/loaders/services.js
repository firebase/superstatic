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

var path = require('path');
var globby = require('globby');
var win32 = process.platform === 'win32'
function resolver (name) {
  
  // TODO: continue here!!!!!!!!!!!!!!!
  var services = findGeneratorsIn(getNpmPaths(), name);
  console.log(services);
  
  // var service;
 
  // var resolveFrom = require('resolve-from');
  // process.env.PATH.split(':').forEach(function (p) {
    
  //   if (!service) {
  //     try {
  //       service = resolveFrom(_.initial(p.split(path.sep)).join(path.sep) + path.sep + 'lib', name);
  //     }
  //     catch (e) {}
      
  //     if (!service) {
  //       try {
  //         service = resolveFrom(_.initial(p.split(path.sep)).join(path.sep), name);
  //       }
  //       catch (e) {}
  //     }
      
  //     console.log(service);
  //   }
  // });
   
  // var npmconf = require('npmconf');
  // npmconf.load({g: true}, function (err, conf) {
    
  //   var service;
  //   var prefix = conf.get('prefix');
    
    
    // if (!service) {
    //   try {
    //     service = resolveFrom(join(prefix, 'lib', 'node_modules'), name);
    //   }
    //   catch (e) {}
      
    //   if (!service) {
    //     try {
    //       service = resolveFrom(join(prefix, 'node_modules'), name);
    //     }
    //     catch (e) {}
    //   }
      
    //   console.log(service);
    // }
    
  //   var service = resolveFrom(prefix + '/lib', name);
    
    
    
  //   // Local require
  //   service = tryRequire(name);
    
  //   // Global require
  //   if (!service) {
  //     service = tryRequire(join(prefix, 'lib', 'node_modules', name));
  //   }
  // });
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
  
  // paths.push('/Users/scott/.nvm/v0.10.36/lib/node_modules');
  
  return paths.reverse();
}

function findGeneratorsIn (searchPaths, name) {
  var modules = [];

  searchPaths.forEach(function (root) {
    if (!root) {
      return;
    }
    
    modules = globby.sync([name], {cwd: root})
      .map(function (match) {
        return path.join(root, match);
      })
      .concat(modules);
  });

  return modules;
}












// function globalRoot () {
  
//   var dirs = process.argv[1].split('/');
  
//   return _.take(dirs, dirs.length - 2).join('/');
// }