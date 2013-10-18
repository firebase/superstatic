var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var through = require('through');
var sinon = require('sinon');
var notFound = require('../../../lib/server/middleware/not_found');

describe('#notFound() middleware', function() {
  beforeEach(setup.beforeEach);
  
  // it('returns 404 if the response path does not exists', function (done) {
  //   var contents = '';
  //   var self = this;
  //   this.res = through();
  //   this.res.writeHead = sinon.spy();
    
  //   notFound(this.req, this.res, function () {});
    
  //   this.res.on('data', function (data) { contents += data.toString(); }).on('end', function () {
  //     expect(self.res.writeHead.calledWith(404, {'Content-Type': 'text/html'})).to.be(true);
  //     expect(contents).to.not.be('');
  //     done();
  //   });
  // });
});