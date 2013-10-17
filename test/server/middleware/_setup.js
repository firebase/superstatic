var path = exports.path = require('path');
var expect = exports.expect = require('expect.js');
var sinon = require('sinon');
var extend = exports.extend = require('node.extend');
var router = exports.router = require('../../../lib/server/middleware/router');
var settings = exports.settings = require('../../fixtures/settings');

exports.beforeEach = function (done) {
  this.settings = {};
  this.res = {
    writeHead: sinon.spy(),
    end: sinon.spy()
  };
  this.req = {
    url: '/about.html'
  };
  
  extend(true, this.settings, settings);
  router(this.settings)(this.req, this.res, done);
};