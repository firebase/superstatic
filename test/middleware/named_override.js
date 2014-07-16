var request = require('supertest');
var superstatic = require('../../lib');
var expect = require('chai').expect;

describe('named middleware override', function() {
  it('overrides the named middleware', function (done) {
    var server = superstatic({
      debug: false,
      middleware: {
        notFound: function(settings, store) {
          return function(req, res, next) {
            res.writeHead('200');
            res.done();
          }
        }
      }
    });

    server.listen(function() {
      request(server)
        .get('/not_found')
        .expect(200)
        .end(function() {
          server.close(done);
        });
    });
  });
});