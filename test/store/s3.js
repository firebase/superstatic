var expect = require('chai').expect;
var sinon = require('sinon');
var Mocksy = require('mocksy');
var knox = require('knox');
var mocksy = new Mocksy({port:8765});
var S3 = require('../../lib/store/s3');

describe('File store - s3', function() {
  beforeEach(function (done) {
    this.client = new S3({
      client: knox.createClient({
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
    expect(this.client._client).to.not.equal(undefined);
  });
  
  it('generates signed urls', function () {
    var filePath = '/index.html';
    this.client._client.signedUrl = sinon.spy();
    var signedUrl = this.client._generateSignedUrl(filePath);
    expect(this.client._client.signedUrl.calledWith(filePath)).to.equal(true);
  });
  
  it('returns the the url path', function () {
    var filePath = '/index.html';
    expect(this.client.getPath(filePath)).to.equal(this.client._generateSignedUrl(filePath));
  });
});

function getRequest (instance) {
  instance.client._generateSignedUrl = function (filePath) {
    return 'http://localhost:8765' + filePath;
  };
  return instance.client.get('/index.html');
}