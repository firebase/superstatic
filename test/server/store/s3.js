var expect = require('expect.js');
var sinon = require('sinon');
var Mocksy = require('mocksy');
var knox = require('knox');
var mocksy = new Mocksy({port:8765});
var request = require('request');
var S3 = require('../../../lib/server/store/s3');

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
    expect(this.client._client).to.not.be(undefined);
  });
  
  it('generates signed urls', function () {
    var filePath = '/index.html';
    this.client._client.signedUrl = sinon.spy();
    var signedUrl = this.client._generateSignedUrl(filePath);
    expect(this.client._client.signedUrl.calledWith(filePath)).to.be(true);
  });
  
  it('sets the mime type of a file', function (done) {
    var response = getRequest(this);
    expect(response.type).to.be('text/html');
    response.on('end', done);
  });
  
  it('streams the file contents from the given path', function (done) {
    var response = getRequest(this);
    expect(response.pipe).to.not.be(undefined);
    response.on('end', done);
  });
});

function getRequest (instance) {
  instance.client._generateSignedUrl = function (filePath) {
    return 'http://localhost:8765' + filePath;
  };
  return instance.client.get('/index.html');
}