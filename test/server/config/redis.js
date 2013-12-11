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
    
    this.redis.client.set('app.hostname.com', '1234', function () {
      self.redis.client.set('1234', JSON.stringify({}), function () {
        mocksy.start(done);
      });
    });
  });
  
  afterEach(function (done) {
    mocksy.stop(done);
  });
  
  it('gets the raw build from the api for a hostname', function (done) {
    this.redis.getRawBuild('app.hostname.com', function (err, response) {
      expect(response.method).to.be('GET');
      expect(response.url).to.be('/builds/lookup?host=app.hostname.com');
      done();
    });
  });
  
  it('gets a build id by hostname', function (done) {
    this.redis.getBuildId('app.hostname.com', function (err, buildId) {
      expect(buildId).to.eql('1234');
      done();
    });
  });
  
  it('loads the build object from the cache', function (done) {
    var self = this;
    this.redis.client.set('1234', JSON.stringify({ id: '1234', config: {} }), function () {
      self.redis.load('app.hostname.com', function (err, build) {
        expect(build).to.have.keys(['id', 'root', 'host', 'buildId', 'cwd', 'routes', 'max_age']);
        expect(self.redis.build).to.eql(build);
        done();
      });
    });
  });
  
  it('determines of a given file path is a file', function (done) {
    var self = this;
    this.redis.client.set('1234', JSON.stringify({ id: '1234', config: {}, files: ['/index.html'] }), function () {
      self.redis.load('app.hostname.com', function (err, build) {
        expect(self.redis.isFile('/index.html')).to.be(true);
        expect(self.redis.isFile('/dir')).to.be(false);
        expect(self.redis.isFile('/file.html')).to.be(false);
        done();
      });
    });
  });
  
  describe('constructing a build object', function() {
    beforeEach(function (done) {
      var self = this;
      
      this.redis.getRawBuild = function (hostname, callback) {
        callback(null, {
          id: '1234',
          config: {}
        });
      };
      
      this.redis.constructBuildObject('app.hostname.com', function (err, buildId) {
        self.buildId = buildId;
        done();
      });
    });
    
    it('returns the build id', function () {
      expect(this.buildId).to.be('1234');
    });
    
    it('sets the key hostname with a value of buildId in the cache', function (done) {
      this.redis.client.get('app.hostname.com', function (err, buildId) {
        expect(buildId).to.eql('1234');
        done();
      });
    });
    
    it('set the key buildId with the value of build oject in the cache', function (done) {
      this.redis.client.get('1234', function (err, build) {
        expect(JSON.parse(build)).to.eql({
          id: '1234',
          config: {
            root: './'
          }
        });
        done();
      });
    });
  });
});