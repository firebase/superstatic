var fs = require('fs-extra');
var expect = require('chai').expect;

var loadEnvFile = require('../../../lib/loaders/config-file');

describe('loading env files', function () {
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/.env.json', '{"key": "value"}', 'utf-8');
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('filename', function (done) {
    
    var data = loadEnvFile('.tmp/.env.json');
    expect(data).to.eql({
      key: 'value'
    });
    done();
  });
  
  it('empty object for when no file', function (done) {
    
    var data = loadEnvFile('.tmp/nope.json');
    expect(data).to.eql({});
    done();
  });
  
  it('returns object if object passed', function (done) {
    
    var data = loadEnvFile({obj: 'data'})
    expect(data).to.eql({obj: 'data'});
    done();
  });
});