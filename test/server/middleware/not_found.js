var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var notFound = require('../../../lib/server/middleware/not_found');

describe('#notFound() middleware', function() {
  beforeEach(setup.beforeEach);
  
  it('returns 404 if the response path does not exists', function () {
    notFound(this.req, this.res, function () {});
    expect(this.res.writeHead.calledWith(404)).to.be(true);
  });
  
  it.skip('returns a 404 - not found response if a requested file does not exist', function (done) {
    done();
  });
});