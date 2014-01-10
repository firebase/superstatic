// var setup = require('./_setup');
// var expect = setup.expect;
// var notFound = require('../../../lib/server/middleware/not_found');
// var Mocksy = require('mocksy');
// var mocksy = new Mocksy({port: 4567});

// describe.skip('#notFound() middleware', function() {
//   beforeEach(function (done) {
//     setup.beforeEachMiddleware.call(this, function () {
//       mocksy.start(done);
//     });
//   });
  
//   afterEach(function (done) {
//     mocksy.stop(done);
//   });
  
//   it.skip('it responds with a default 404 page', function () {
    
//   });
  
//   it('responds with a custom 404 page', function () {
//     this.req.ss.config.config.error_page = 'http://localhost:4567/error.html';
//     notFound(this.req, this.res, this.next);
//   });
// });