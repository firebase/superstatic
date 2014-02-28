var path = require('path');
var mix = require('mix-into');

module.exports = mix({
  _rootCwd: '/',
  configuration: {
    root: './',
    index: 'index.html'
  },
  load: function (key, callback) {
    callback(null, {});
  },
  isFile: function () {
    return true;
  },
  rootPathname: function (pathname) {
    return path.join(this._rootCwd, this.configuration.root, pathname);
  }
});