var setup = require('./_setup');
var expect = setup.expect;
var removeTrailingSlash = require('../../../lib/server/middleware/remove_trailing_slash');

describe('#removeTrailingSlash() middleware', function() {
  beforeEach(setup.beforeEachMiddleware);
  
  it('removes the trailing slash for a given url', function () {
    this.req.url = '/about/';
    removeTrailingSlash(this.req, this.res, this.next);
    
    expect(this.res.writeHead.calledWith(301, {Location: '/about'})).to.be(true);
    expect(this.res.end.called).to.be(true);
    expect(this.next.called).to.be(false);
  });
  
  it('does not redirect the root url because of the trailing slash', function () {
    this.req.url = '/'
    removeTrailingSlash(this.req, this.res, this.next);
    expect(this.next.called).to.be(true);
  });
});