var connect = require('connect');
var request = require('supertest');
var env = require('../../lib/middleware/env');
var defaultSettings = require('../../lib/settings/default');
var util = require('util');
var clone = require('clone');

describe('env middleware', function() {
  var app;
  var settings;
  
  describe('with local env', function() {
    beforeEach(function () {
      app = connect();
      settings = defaultSettings.create();
      settings.build = appBuild({
        key1: 'value1'
      });
      app.use(env(settings, {local:'environment'}));
    });

    it('merges local env into env values', function (done) {
      request(app)
        .get('/__/env.json')
        .expect('Content-Type', 'application/json')
        .expect(200)
        .expect(function (response) {
          if (JSON.stringify(response.body) != JSON.stringify({key1: 'value1', local: 'environment'})) {
            return 'wrong json content: ' + JSON.stringify(response.body);
          }
        })
        .end(done);
    });

  });

  describe('with no local env', function() {
    beforeEach(function () {
      app = connect();
      settings = defaultSettings.create();
      settings.build = appBuild({
        key1: 'value1',
        key2: 'value2'
      });
      app.use(env(settings));
    });
    
    it('intercepts the request for the environment javascript file', function (done) {
      request(app)
        .get('/__/env.js')
        .expect('Content-Type', 'text/javascript')
        .expect(200)
        .expect(/return {"key1":"value1","key2":"value2"};/)
        .end(done);
    });

    it('intercepts the request for the environment json file', function (done) {
      request(app)
        .get('/__/env.json')
        .expect('Content-Type', 'application/json')
        .expect(200)
        .expect({
          key1: 'value1',
          key2: 'value2'
        })
        .end(done);
    });
  });
});

function appBuild (env) {
  return clone({
    env: {
      config: {
        env: clone(env)
      }
    }
  });
}