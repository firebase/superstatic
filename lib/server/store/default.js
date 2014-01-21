var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  cwd: './',
  getPath: function (pathname) {
    return pathname;
  }
});