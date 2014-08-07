var _ = require('lodash');
var superstatic = require('../../');
var expect = require('chai').expect;
var request = require('supertest');
var ROOT_DIR = __dirname + '/fixtures';

describe('serving requests', function () {
  describe('basic', function () {
    var app;
    
    beforeEach(function (done) {
      app = superstatic({
        debug: false,
        config: {
          root: ROOT_DIR,
          error_page: 'error.html'
        }
      });
      
      app.listen(done);
    });
    
    afterEach(function (done) {
      app.close(done);
    });
    
    it('gets the index file', function (done) {
      request(app)
        .get('/')
        .expect('index.html')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200)
        .end(done);
    });
    
    it('gets an html file', function (done) {
      request(app)
        .get('/about.html')
        .expect('about.html')
        .expect(200)
        .end(done);
    });
    
    it('gets a js file', function (done) {
      request(app)
        .get('/app.js')
        .expect('// app.js')
        .expect(200)
        .expect('Content-Type', 'application/javascript')
        .end(done);
    });
    
    it('gets a css file', function (done) {
      request(app)
        .get('/style.css')
        .expect('/* style.css */')
        .expect(200)
        .expect('Content-Type', 'text/css; charset=UTF-8')
        .end(done);
    });
    
    it('serves an error page', function (done) {
      request(app)
        .get('/asdfasdf')
        .expect('error.html')
        .expect(404)
        .end(done);
    });
  });

  describe('with settings', function () {
    describe('redirects', function () {
      it('to url', function (done) {
        serverWithConfig({
          redirects: {
            '/from': '/to'
          }
        }, function (err, app) {
          request(app)
            .get('/from')
            .expect(301)
            .expect('Location', '/to')
            .end(endApp(app, done));
        });
      });
    });
    
    function serverWithConfig(config, done) {
      var app = superstatic({
        debug: false,
        config: _.extend({
          root: ROOT_DIR
        }, config)
      })
      app.listen(function (err) {
        done(err, app);
      });
    }
    
    function endApp (app, done) {
      return function (err) {
        (err) ? done(err) : app.close(done);
      };
    }
  });
});