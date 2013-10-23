var path = require('path');
var setup = require('./_setup');
var expect = setup.expect;
var sinon = require('sinon');
var settingsCache = require('../../../lib/server/middleware/settings_cache');

// describe('#settingsCache() middleware', function() {
//   beforeEach(setup.beforeEach);
  
//   it('should do what...', function () {
//     var cache = this.req.ss.settings.cache = sinon.spy();
//     settingsCache(this.req, this.res, function () {});
//     expect(cache.called).to.be(true);
//   });
  
//   it('should respond with 404 there is an error retrieving cache', function () {
//     var self = this;
//     this.req.ss.settings.cache = function (callback) {
//       callback(true);
//     };
    
//     settingsCache(this.req, this.res, function () {});
//     expect(self.res.notFound).to.be(true);
//   });
// });