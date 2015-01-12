var connect = require('connect');
var request = require('supertest');
var expect = require('chai').expect;

var superstatic = require('../../');

describe('response helpers', function () {
  
  it('removes helpers no files served', function (done) {
    
    var hasHelpers = false;
    
    var app = connect()
      .use(superstatic({
        config: {
          root: './'
        }
      }))
      .use(function (req, res, next) {
        
        if (res.__ !== undefined) {
          hasHelpers = true;
        }
        
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        
        expect(hasHelpers).to.equal(false);
      })
      .end(done);
  });
});