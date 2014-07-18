var cleanUrls = require('../../lib/middleware/clean_urls');
var connect = require('connect');
var request = require('supertest');
var query = require('connect-query');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rmdir = require('rmdir');

describe('clean urls middleware', function () {
  afterEach(function (done) {
    if(fs.existsSync('.tmp')) rmdir('.tmp', done);
    else done();
  });
  
  it('redirects to the clean url path when static html file is requested', function (done) {
    var app = connect()
      .use(cleanUrls());
    
    request(app)
      .get('/superstatic.html')
      .expect('Location', '/superstatic')
      .expect(301)
      .end(done);
  });
  
  it('it redirects and keeps the query string', function (done) {
    var app = connect()
      .use(query())
      .use(cleanUrls());
    
    request(app)
      .get('/superstatic.html?key=value')
      .expect('Location', '/superstatic?key=value')
      .expect(301)
      .end(done);
  });
  
  it('serves the .html version of the clean url if clean_urls are on', function (done) {
    mkdirp.sync('.tmp');
    fs.writeFileSync('.tmp/superstatic.html', 'test', 'utf8');
    
    var app = connect()
      .use(cleanUrls({
        root: '.tmp'
      }));
    
    request(app)
      .get('/superstatic')
      .expect(200)
      .expect('test')
      .end(done);
  });
  
  // TODO: fix this test. this
  // does nothing right now
  it('sets the default root if no root in config and no root in settings', function (done) {
    var app = connect()
      .use(cleanUrls());
     
    request(app)
      .get('/asdf')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if it is the root path', function (done) {
    var app = connect()
      .use(cleanUrls());
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('skips the middleware if it is not a file and clean_urls are on', function (done) {
    mkdirp.sync('.tmp');
    fs.writeFileSync('.tmp/yep.html', 'yep');
    
    var app = connect()
      .use(cleanUrls({
        root: '.tmp'
      }));
    
    request(app)
      .get('/nope')
      .expect(404)
      .end(done);
  });
});