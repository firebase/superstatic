var path = exports.path = require('path');
var expect = exports.expect = require('expect.js');
var sinon = require('sinon');
var extend = exports.extend = require('node.extend');
var router = exports.router = require('../../../lib/server/middleware/router');
var settings = exports.settings = require('../../fixtures/settings');
var store = exports.store = {};
var through = require('through');

exports.beforeEach = function (done) {
  this.settings = {};
  this.store = {
    get: function () {
      var stream = through();
      stream.type = 'text/html';
      return stream;
    }
  };
  this.res = {
    writeHead: sinon.spy(),
    end: sinon.spy()
  };
  this.req = {
    url: '/about.html',
    ssRouter: {
      store: this.store
    }
  };
  
  extend(true, this.settings, settings);
  router(this.settings, this.store)(this.req, this.res, done);
};