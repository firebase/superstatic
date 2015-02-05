var fs = require('fs-extra');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');

var slashify = require('../../../lib/middleware/slashify');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('trailing slashes', function () {
  
  var provider = dfs({
    root: '.tmp'
  });
  var app;
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/index.html', 'index', 'utf8');
    fs.outputFileSync('.tmp/about/index.html', 'about index', 'utf8');
    
    app = connect()
      .use(function (req, res, next) {
        
        responder({
          req: req,
          res: res,
          provider: provider
        });
        next();
      });
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('removes the trailing slash for a given url', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/testing/')
      .expect(301)
      .expect('Location', '/testing')
      .end(done);
  });
  
  it('does not redirect the root url because of the trailing slash', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('does not redirect for directory index files', function (done) {
    
    var app = connect()
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/about/')
      .expect(404)
      .expect(function (data) {
        expect(data.req.path).to.equal('/about/');
      })
      .end(done);
  });
  
  it('redirects directory index to have a trailing slash', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/about')
      .expect(function (req) {
        expect(req.headers.location).to.equal('/about/');
      })
      .expect(301)
      .end(done);
  });
  
  it('preserves the query parameters on redirect', function (done) {
    
    app.use(slashify({
      provider: provider
    }));
    
    request(app)
      .get('/contact/?query=param')
      .expect(301)
      .expect('Location', '/contact?query=param')
      .end(done);
  });
});