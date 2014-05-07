var expect = require('expect.js');
var connect = require('connect');
var request = require('supertest');
var redirect = require('../../../lib/server/middleware/redirect');

describe('redirect middleware', function () {
  
  it('skips the middleware if there are no redirects configured', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {};
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });
  
  it('skips middleware when there are no matching redirects', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {
          redirects: {
            '/source': '/redirect'
          }
        };
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/none')
      .expect(404)
      .end(done);
  });
  
  it('redirects to a configured redirects object with a default status code of 301', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {
          redirects: {
            '/source': '/redirect'
          }
        };
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });
  
  it('redirects to a configured path with a custom status code', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {
          redirects: {
            '/source': {
              status: 302,
              url: '/redirect'
            }
          }
        };
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/source')
      .expect(302)
      .expect('location', '/redirect')
      .end(done);
  });
  
  it('adds leading slash to all redirect paths', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {
          redirects: {
            'source': '/redirect' // No slash
          }
        };
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });
  
  it('redirects using wildcard values in the url path', function (done) {
    var app = connect()
      .use(function (req, res, next) {
        req.config = {
          redirects: {
            '/old/:value/path/:loc': '/new/:value/path/:loc' // No slash
          }
        };
        next();
      })
      .use(redirect());
    
    request(app)
      .get('/old/redirect/path/there')
      .expect(301)
      .expect('location', '/new/redirect/path/there')
      .end(done);
  });
  
});