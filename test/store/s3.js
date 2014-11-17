var expect = require('chai').expect;
var Mocksy = require('mocksy');
var knox = require('knox');
var mocksy = new Mocksy({port:8765});
var S3 = require('../../lib/store/s3');

describe('File store - s3', function() {
  beforeEach(function (done) {
    this.client = new S3({
      _hashedClient: knox.createClient({
        key: 'key',
        secret: 'secret',
        bucket: 'bucket'
      })
    });
    
    mocksy.start(done);
  });
  
  afterEach(function (done) {
    mocksy.stop(done);
  });
  
  it('creates a knox s3 client', function () {
    expect(this.client._hashedClient).to.not.equal(undefined);
  });
  
  it.skip('returns the hashed the url path', function () {
    var filePath = '/index.html';
    console.log(this.client.getPath({
      build: {
        id: 1
      }
    }, filePath));
    // expect(this.client.getPath(null, filePath)).to.equal(this.client._generateSignedUrl(filePath));
  });
});

function getRequest (instance) {
  instance.client._generateSignedUrl = function (filePath) {
    return 'http://localhost:8765' + filePath;
  };
  return instance.client.get('/index.html');
}