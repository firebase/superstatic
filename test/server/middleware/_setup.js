var path = exports.path = require('path');
var expect = exports.expect = require('expect.js');
var sinon = require('sinon');
var router = exports.router = require('../../../lib/server/middleware/router');
var settings = exports.settings = require('../../fixtures/settings');
var store = exports.store = {};
var _ = require('lodash');

var req = exports.req = function () {
  return _.cloneDeep({
    connection: {},
    url: '/superstatic.html',
    ss: {
      config: {
        cwd: '/',
        root: './',
        files: [
          '/root/superstatic.html',
          '/superstatic.html',
          '/contact/index.html'
        ],
        
        // From config file
        routes: {
          'custom-route': 'superstatic.html',
          'app**': 'superstatic.html',
          'app/**': 'superstatic.html',
          'app/test/**': 'superstatic.html',
          'app/test**': 'superstatic.html'
        },
        config: {},
        
        // Routes defined by us
      },
      store: {}
    },
    ssRouter: {}
  });
};

var res = exports.res = function () {
  return _.cloneDeep({
    writeHead: sinon.spy(),
    end: sinon.spy(),
    setHeader: sinon.spy()
  });
};

var next = exports.next = function () {
  return sinon.spy();
};

var skipsMiddleware = exports.skipsMiddleware = function (middleware) {
  middleware(this.req, this.res, this.next);
  expect(this.next.called).to.equal(true);
  expect(this.req.superstatic).to.equal(undefined);
}

var setupRouter = exports.setupRouter = function (req, res, callback) {
  router({}, {}, [
    {
      path: '/cache',
      method: 'GET',
      validate: {
        headers: sinon.spy()
      },
      handler: function (req, res) {
        res.callback();
      }
    }
  ])(req, res, callback);
};

exports.beforeEachMiddleware = function (done) {
  this.req = req();
  this.res = res();
  this.next = next();
  
  setupRouter(this.req, this.res, done);
};

/*
Usage in tests: ^^^^
==========================
beforeEach(function (done) {
  setup.beforeEachMiddleware.call(this, done);
});

~ OR ~

beforeEach(setup.beforeEachMiddleware);
 */