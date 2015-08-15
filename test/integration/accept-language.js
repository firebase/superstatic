var fs = require('fs-extra');
var _ = require('lodash');
var connect = require('connect');
var request = require('supertest');
var expect = require('chai').expect;
var query = require('connect-query');

var superstatic = require('../../');

var options = function () {
  return {
    config: {
      root: '.tmp'
    }
  };
};

describe('accept language', function () {
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/de/index.html', 'de index', 'utf8');
    fs.outputFileSync('.tmp/en/index.html', 'en sub', 'utf8');
  });
  
  afterEach(function () {

    fs.removeSync('.tmp');
  });
  
  it('redirects root to de if available', function (done) {
    
    var opts = options();
    
    opts.config.languages = ['en', 'de'];
    
    var app = connect()
      .use(superstatic(opts));
    
    request(app)
      .get('/')
      .set('Accept-Language', 'de, en-gb;q=0.8, en;q=0.7')
      .expect(301)
      .expect('Location', '/de')
      .end(done);
  });

  it('redirects root to first given if no language matches', function (done) {
    
    var opts = options();
    
    opts.config.languages = ['en', 'de'];
    
    var app = connect()
      .use(superstatic(opts));
    
    request(app)
      .get('/')
      .set('Accept-Language', 'pl, hu;q=0.8')
      .expect(301)
      .expect('Location', '/en')
      .end(done);
  });

it('redirects root to less preferred matches', function (done) {
    
    var opts = options();
    
    opts.config.languages = ['en', 'de'];
    
    var app = connect()
      .use(superstatic(opts));
    
    request(app)
      .get('/')
      .set('Accept-Language', 'pl, de_DE;q=0.8')
      .expect(301)
      .expect('Location', '/de')
      .end(done);
  });
});