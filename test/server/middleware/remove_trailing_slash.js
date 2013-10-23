var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var sinon = require('sinon');
var removeTrailingSlash = require('../../../lib/server/middleware/remove_trailing_slash');

// describe('#removeTrailingSlash() middleware', function() {
//   beforeEach(setup.beforeEach);
  
//   it('removes the trailing slash for a given url', function () {
//     this.req.url = '/about/';
//     removeTrailingSlash(this.req, this.res, function () {});
//     expect(this.res.writeHead.calledWith(301, {Location: '/about'})).to.be(true);
//     expect(this.res.end.called).to.be(true);
//   });
  
//   it('does not redirect the root url because of the trailing slash', function () {
//     var callbackSpy = sinon.spy();
//     this.req.url = '/'
//     removeTrailingSlash(this.req, this.res, callbackSpy);
//     expect(callbackSpy.called).to.be(true);
//   });
// });