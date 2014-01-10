// var setup = require('./_setup');
// var expect = setup.expect;
// var restful = require('../../../lib/server/middleware/restful')();

// describe('#restful() middleware', function() {
//   beforeEach(setup.beforeEachMiddleware);
  
//   it('skips the middleware if pathname has no match in routes', function () {
//     this.req._parsedUrl = {pathname: '/nope'};
    
//     restful(this.req, this.res, this.next);
//     expect(this.next.called).to.be(true);
//   });
  
//   it('skips the middleware if request method has no match in routes', function () {
//     this.req._parsedUrl = {pathname: '/cache'};
//     this.req.method = 'POST';
    
//     restful(this.req, this.res, this.next);
//     expect(this.next.called).to.be(true);
//   });
  
//   it('runs each validate method in parallel and calls route handler as last item in chain', function (done) {
//     var headersCalled = false;
//     this.req._parsedUrl = {pathname: '/cache'};
//     this.req.method = 'GET';
//     var route = this.req.ss.routes[0]
    
//     route.validate.headers = function  (req, res, next) {
//       headersCalled = true;
//       next();
//     };
    
//     this.res.callback = function () {
//       expect(headersCalled).to.be(true);
//       done();
//     };
    
//     restful(this.req, this.res, this.next);
//   });
// });