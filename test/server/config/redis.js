var expect = require('expect.js');
var redis = require('redis-mock');
var Mocksy = require('mocksy');
var mocksy = new Mocksy({port:8765});
var ConfigRedis = require('../../../lib/server/config/redis');
var redisOptions = {
  client: redis.createClient()
};

describe('Redis - remote settings', function() {
  beforeEach(function (done) {
    var self = this;
    
    process.env.API_HOST = 'http://localhost:8765';
    this.redis = new ConfigRedis(redisOptions);
    
    this.redis.client.set('host:app.hostname.com:build', 'builds:1234', function () {
      self.redis.client.set('builds:1234', JSON.stringify({
        id: '1234',
        config: {},
        files: ['/index.html']
      }), function () {
        self.redis.client.set('host:app.hostname.com:env', 'apps:5678:production', function () {
          self.redis.client.set('apps:5678:production', JSON.stringify({}), function () {
            mocksy.start(done);
          });
        });
      });
    });
  });
  
  afterEach(function (done) {
    mocksy.stop(done);
  });
  
  // TODO: need to test the key factory methods (_buildCacheKey(), etc.)
  // and need to test various other "whitebox pieces"
  
  it('loads the build object from the cache', function (done) {
    var self = this;
    
    this.redis.load('app.hostname.com', function (err, release) {
      expect(release).to.have.keys([
        'id',
        'root',
        'host',
        'buildId',
        'cwd',
        'routes',
        'max_age',
        'config',
        'files'
      ]);
      
      done();
    });
  });
  
  it('determines of a given file path is a file', function (done) {
    var self = this;
    this.redis.load('app.hostname.com', function (err, build) {
      expect(self.redis.isFile('/index.html')).to.be(true);
      expect(self.redis.isFile('/dir')).to.be(false);
      expect(self.redis.isFile('/file.html')).to.be(false);
      done();
    });
  });
});