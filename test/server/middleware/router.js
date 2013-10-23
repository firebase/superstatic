var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var sinon = require('sinon');
var router = require('../../../lib/server/middleware/router');

// describe('#router() middleware', function(done) {
//   beforeEach(function (done) {
//     var self = this;
//     this.routerMiddleware = router(setup.extend(setup.settings), setup.extend(setup.store));
//     this.res = {
//       writeHead: sinon.spy(),
//       end: sinon.spy()
//     };
//     this.req = {
//       url: '/about.html'
//     };
    
//     this.routerMiddleware(this.req, this.res, function () {
//       self.router = self.req.ssRouter;
//       done();
//     });
//   });
  
//   it('defines default settings attribute', function () {
//     expect(this.router.settings).to.not.be(undefined);
//   });
  
//   it('defines default cleanUrls attribute', function () {
//     expect(this.router.cleanUrls).to.not.be(undefined);
//   });
  
//   it('defines default routes attribute', function () {
//     expect(this.router.routes).to.not.be(undefined);
//   });
  
//   it('defines default files attribute', function () {
//     expect(this.router.files).to.not.be(undefined);
//   });
  
//   it('defines the default file store', function () {
//     expect(this.router.store).to.not.be(undefined);
//   });
  
//   it('determines if file exists in file list', function () {
//     var path = '/index.html';
//     expect(this.router.isFile(path)).to.be(true);
//   });
  
//   it('determines if a path is an html file', function () {
//     var path = '/about.html';
//     expect(this.router.isHtml(path)).to.be(true);
//   });
  
//   it('builds the file url', function () {
//     var filePath = this.router._buildFilePath('/about.html');
//     expect(filePath).to.be(path.join(process.cwd(), this.router.settings.configuration.root, '/about.html'));
//   });
// });