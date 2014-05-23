var expect = require('chai').expect;
var connect = require('connect')
var request = require('supertest');
var sender = require('../../lib/middleware/sender');
var defaultFileStore = require('../../lib/store/default');

describe('sender middleware', function() {
  var app;
  var fileStore;
  
  beforeEach(function () {
    app = connect();
    fileStore = defaultFileStore.create();
  });
  
  it('puts a #send() method on the response object', function (done) {
    app.use(sender(fileStore));
    
    app.use(function (req, res, next) {
      expect(res.send).to.not.equal(undefined);
      next();
    });
    
    request(app).get('/').end(done);
  });
    
  it('sends a file with no relative path', function (done) {
    // var url = '../../fixtures/sample_app/index.html';
    
    // app.use(sender(fileStore));
    // app.use(function (req, res, next) {      // expect(res.send).to.not.equal(undefined);
    //   var contents = '';
      
    //   res.send(req.url, true)
    //     .on('data', function (chunk) {
    //       console.log('here');
    //       contents += chunk;
    //     })
    //     .on('end', function () {
    //       console.log(contents);
    //       next();
    //     });
    //   done();
        
    // });
    
    // request(app).get('/').end(function () {
      
    // });
    
  //   this.res.on = function () {};
  //   this.sender(this.req, this.res, this.next);
  //   this.res.send(url, true)
    
  //   expect(this.req.url).to.equal(url);
  //   expect(this.res.end.called).to.equal(true);
    done();
  });
});