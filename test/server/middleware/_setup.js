var sinon = require('sinon');

exports.configure = function (ctx) {
  ctx.req = {
    ss: {
      pathname: '/superstatic.html'
    },
    config: {
      index: 'index.html',
      root: './'
    },
    rootPathname: function (pathname) {
      return pathname;
    },
    settings: {
      isFile: function () {
        return true;
      }
    },
    query: ''
  };
  
  ctx.res = {
    send: sinon.spy(),
    writeHead: sinon.spy(),
    end: sinon.spy(),
    setHeader: sinon.spy()
  };
  
  ctx.next = sinon.spy();
};



// var path = exports.path = require('path');
// var expect = exports.expect = require('expect.js');
// var sinon = require('sinon');
// var router = exports.router = require('../../../lib/server/middleware/router');
// var _ = require('lodash');
// var Settings = require('../../../lib/server/config/file');
// var Store = require('../../../lib/server/store/local');

// var req = exports.req = function () {
//   return _.cloneDeep({
//     connection: {},
//     url: '/superstatic.html',
//     headers: {},
//     ss: {
//       pathname: '/superstatic.html',
//       config: {
//         cwd: '/',
//         root: './',
        
//         // From config file
//         routes: {
//           'custom-route': 'superstatic.html',
//           'app**': 'superstatic.html',
//           'app/**': 'superstatic.html',
//           'app/test/**': 'superstatic.html',
//           'app/test**': 'superstatic.html',
//           'exists': 'does-not-exists.html'
//         },
//         config: {},
//       },
//     },
//   });
// };

// var res = exports.res = function () {
//   return _.cloneDeep({
//     writeHead: sinon.spy(),
//     end: sinon.spy(),
//     setHeader: sinon.spy()
//   });
// };

// var next = exports.next = function () {
//   return sinon.spy();
// };

// var skipsMiddleware = exports.skipsMiddleware = function (middleware) {
//   middleware(this.req, this.res, this.next);
//   expect(this.next.called).to.equal(true);
//   expect(this.req.superstatic).to.equal(undefined);
// }

// var setupRouter = exports.setupRouter = function (req, res, callback) {
//   var cwd = path.resolve(__dirname, '../../fixtures/sample_app');
//   var settings = new Settings({ cwd: cwd });
//   var store = new Store({ cwd: cwd });
  
//   router(settings, store, [
//     {
//       path: '/cache',
//       method: 'GET',
//       validate: {
//         headers: sinon.spy()
//       },
//       handler: function (req, res) {
//         res.callback();
//       }
//     }
//   ])(req, res, callback);
// };

// exports.beforeEachMiddleware = function (done) {
//   this.req = req();
//   this.res = res();
//   this.next = next();
  
//   setupRouter(this.req, this.res, done);
// };

// /*
// Usage in tests: ^^^^
// ==========================
// beforeEach(function (done) {
//   setup.beforeEachMiddleware.call(this, done);
// });

// ~ OR ~

// beforeEach(setup.beforeEachMiddleware);
//  */