// var setup = require('./_setup');
// var expect = setup.expect;
// var removeTrailingSlash = require('../../../lib/server/middleware/remove_trailing_slash');

// describe('#removeTrailingSlash() middleware', function() {
//   beforeEach(setup.beforeEachMiddleware);
  
//   it('removes the trailing slash for a given url', function () {
//     this.req.ss.pathname = '/about/';
//     removeTrailingSlash(this.req, this.res, this.next);
    
//     expect(this.res.writeHead.calledWith(301, {Location: '/about'})).to.be(true);
//     expect(this.res.end.called).to.be(true);
//     expect(this.next.called).to.be(false);
//   });
  
//   it('does not redirect the root url because of the trailing slash', function () {
//     this.req.ss.pathname = '/'
//     removeTrailingSlash(this.req, this.res, this.next);
//     expect(this.next.called).to.be(true);
//   });
  
//   it('preservers the query parameters on redirect', function () {
//     this.req.url = '/contact/?query=param';
//     this.req.ss.pathname = '/contact/';
//     this.req.query = {query: 'param'};
    
//     removeTrailingSlash(this.req, this.res);
    
//     expect(this.res.writeHead.args[0][1]).to.eql({Location: '/contact?query=param'});
//   });
// });