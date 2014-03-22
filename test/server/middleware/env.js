var connect = require('connect');
var request = require('supertest');
var env = require('../../../lib/server/middleware/env');
var defaultSettings = require('../../../lib/server/settings/default');
var util = require('util');

describe('env middleware', function() {
  var app;
  var settings;
  
  beforeEach(function () {
    app = connect();
    settings = defaultSettings.create();
    settings.build = {
      env: {
        config: {
          auth: 'username:password',
          env: {
            key1: 'value1',
            key2: 'value2'
          }
        }
      }
    };
    app.use(env(settings));
  });
  
  it('intercepts the request for the environment javascript file');
  // Not sure how to test the respons body here.
  // response.body is an Object.
  // , function (done) {
  //   request(app)
  //     .get('/__/env')
  //     .expect('Content-Type', 'text/javascript')
  //     .expect(200)
  //     .expect(function (response) {
  //       if (response.body != 'this.__env = ' + JSON.stringify(settings.build.env.config.env) + ';') {
  //         return 'wrong js content: ' + JSON.stringify(response.body);
  //       }
  //     })
  //     .end(done);
  // });

  it('intercepts the request for the environment json file', function (done) {
    request(app)
      .get('/__/env.json')
      .expect('Content-Type', 'application/json')
      .expect(200)
      .expect(function (response) {
        if (JSON.stringify(response.body) != JSON.stringify(settings.build.env.config.env)) { 
          return 'wrong json content: ' + JSON.stringify(response.body);
        }
      })
      .end(done);
  });
});