var compare = require('compare-semver');
var format = require('chalk');
var stringLength = require('string-length');

var pkg = require('../package.json');

module.exports = function (package) {
  
  if (compare.gt(package.current, [package.latest])) {
    return;
  }
  
  var msg = [
    format.bold.yellow('A new version of Superstatic is available'),
    '',
    'Your current version is ' + format.green.bold(package.current) + '.',
    'The latest version is ' + format.green.bold(package.latest) + '.',
    '', 
    'Run ' + format.bold.yellow('npm install superstatic -g') + ' to update.',
  ];
  
  var contentWidth = 0;
  msg = msg
    .map(function (line) {
      
      return '  ' + line;// + format.yellow('│');
    });
  
  msg.forEach(function (line) {
      
      if (stringLength(line) > contentWidth) {
        contentWidth = stringLength(line);
      }
    });
  
  var fill = function (str, count) {
    return Array(count + 1).join(str);
  };
  
  var top = format.yellow('┌' + fill('─', contentWidth) + '┐');
  var bottom = format.yellow('└' + fill('─', contentWidth) + '┘');
  
  console.log('');
  console.log(top);
  console.log(msg.join('\n'));
  console.log(bottom);
  console.log('');
};