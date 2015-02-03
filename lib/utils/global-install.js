var async = require('async');
var spawn = require('cross-spawn');
var spinner = require('char-spinner');

module.exports = function globalInstall (packages, done) {
  
  var spinnerInterval = spinner({});
  
  async.each(packages, function (packageName, installed) {
    
   spawn('npm', ['install', packageName, '-g'])
    .on('close', installed);
  }, function (err) {
    
    // Stop spinner and clear line
    clearInterval(spinnerInterval);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    done(err);
  });
};