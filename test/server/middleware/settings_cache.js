var setup = require('./_setup');
var expect = setup.expect;
var settingsCache = require('../../../lib/server/middleware/settings_cache');

describe('#settingsCache() middleware', function() {
  beforeEach(function (done) {
    var self = this;
    this.loadCalled = false;
    setup.beforeEachMiddleware.call(this, function () {
      self.req.ss.settings.load = function (hostname, callback) {
        self.loadCalled = true;
        callback(null, {});
      };
      self.req.headers = {
        host: 'localhost:4000'
      };
    });
    done();
  });
  
  it('loads and sets the settings from the settings store', function () {
    settingsCache(this.req, this.res, this.next);
    expect(this.loadCalled).to.be(true);
    expect(this.req.ss.config).to.eql({});
    expect(this.next.called).to.be(true);
  });
  
  it('skips setting config if there was an error getting settings', function () {
    var self = this;
    this.req.ss.settings.load = function (hostname, callback) {
      self.loadCalled = true;
      callback(true);
    };
    
    settingsCache(this.req, this.res, this.next);
    expect(this.req.ss.config).to.not.eql({});
    expect(this.next.called).to.be(true);
  });
});