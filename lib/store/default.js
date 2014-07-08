var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  cwd: './',
  getPath: function (settings, pathname) {
    return pathname;
  }
});