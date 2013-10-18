var fs = require('fs');
var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var sinon = require('sinon');
var through = require('through');
var responder = require('../../../lib/server/middleware/responder');

describe('#responder() middleware', function() {
  beforeEach(function (done) {
    var self = this;
    this.filePath = 'tmp.html';
    this.fileContents = 'some data';
    
    setup.beforeEach.call(this, function () {
      fs.writeFileSync(self.filePath, this.fileContents);
      done();
    });
  });
  
  afterEach(function (done) {
    fs.unlinkSync(this.filePath);
    done();
  });
  
  it('sets the Content-Header according the file mime type', function () {
    this.res = through();
    this.res.setHeader = sinon.spy();
    this.req = {
      url: '/about.html',
      superstatic: {
        path: this.filePath
      }
    };
    
    responder(this.req, this.res);
    expect(this.res.setHeader.calledWith('Content-Type', 'text/html')).to.be(true);
  });
  
  it('pipes file contents as the response', function (done) {
    this.res = through();
    this.res.setHeader = sinon.spy();
    this.req = {
      url: '/about.html',
      superstatic: {
        path: this.filePath
      }
    };
    responder(this.req, this.res);
    this.res.on('end', function () {
      done();
    });
  });
});