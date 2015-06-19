var connect = require('connect');
var request = require('supertest');

var superstatic = require('../../');

var options = function () {
  return {
    config: {
      root: '.tmp'
    }
  };
};

describe('caching', function () {

  it('default cache control', function (done) {

    var opts = options();

    opts.config.cache_control = {
      '**': true
    };

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=300')
      .end(done);
  });

  it('custom cache control', function (done) {

    var opts = options();

    opts.config.cache_control = {
      '**': 1234
    };

    var app = connect()
      .use(superstatic(opts));

    request(app)
      .get('/')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=1234')
      .end(done);
  });
});
