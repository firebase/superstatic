var request = require('supertest');
var superstatic = require('../../lib');
var expect = require('chai').expect;

describe('named middleware override', function() {
  it('overrides the named middleware', function (done) {
    var server = superstatic({
      middleware: {
        notFound: function(settings, store) {
          return function(req, res, next) {
            console.log(req.constructor, res.constructor);
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