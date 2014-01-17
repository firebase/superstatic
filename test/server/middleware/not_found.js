var fs = require('fs');
var path = require('path');
var setup = require('./_setup');
var expect = require('expect.js');
var notFound = require('../../../lib/server/middleware/not_found');
var notFoundTpl = path.resolve(__dirname, '../../../lib/server/templates/not_found.html');
var Mocksy = require('mocksy');
var mocksy = new Mocksy({port: 4567});

describe('not found middleware', function() {
  beforeEach(function (done) {
    this.notFound = notFound();
    setup.configure(this);
    mocksy.start(done);
  });
  
  afterEach(function (done) {
    mocksy.stop(done);
  });
  
  it('serves the default 404 page', function () {
    this.notFound(this.req, this.res, this.next);
    expect(this.res.send.calledWith(notFoundTpl, true)).to.equal(true);
  });
  
  it('servers a custom 404 page', function () {
    fs.writeFileSync('error.html', 'error');
    this.req.config.error_page = 'error.html';
    this.notFound(this.req, this.res, this.next);
    expect(this.res.send.calledWith('error.html', true)).to.equal(true);
    fs.unlinkSync('error.html');
  });
  
  it('servers the default 404 page if the configured file does not exist', function () {
    this.req.config.error_page = 'error.html';
    this.notFound(this.req, this.res, this.next);
    expect(this.res.send.calledWith(notFoundTpl, true)).to.equal(true);
  });
  
  it('proxies a remote 404 page', function (done) {
    this.req.config.error_page = 'http://localhost:4567';
    this.notFound(this.req, this.res, this.next);
    expect(this.res.send.calledWith('http://localhost:4567', true)).to.equal(true);
    done();
  });
});