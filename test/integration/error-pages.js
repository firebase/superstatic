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

describe('error page', function () {
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/override-error.html', 'override error', 'utf8');
    fs.outputFileSync('.tmp/error.html', 'config error', 'utf8');
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('from config', function (done) {
    
    var opts = options();
    
    opts.config.error_page = '/error.html';
    
    var app = connect()
      .use(superstatic(opts));
    
    request(app)
      .get('/does-not-exist')
      .expect(404)
      .expect('config error')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
  });
  
  it('falls back to default when configured error page does not exist', function (done) {
    
    var opts = options();
    
    opts.errorPage = '.tmp/does-not-exist.html';
    
    var app = connect()
      .use(superstatic(opts));
    
    request(app)
      .get('/does-not-exist')
      .expect(404)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
  });
});