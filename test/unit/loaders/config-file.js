var fs = require('fs-extra');
var expect = require('chai').expect;

var loadConfigFile = require('../../../lib/loaders/config-file');

describe('loading config files', function () {
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/file.json', '{"key": "value"}', 'utf-8');
  });
  
  afterEach(function () {
    
    fs.removeSync('.tmp');
  });
  
  it('filename', function (done) {
    
    var data = loadConfigFile('.tmp/file.json');
    
    expect(data).to.eql({
      key: 'value'
    });
    done();
  });
  
  it('loads first existing file in array', function (done) {
    
    var data = loadConfigFile(['another.json', '.tmp/file.json']);
    
    expect(data).to.eql({
      key: 'value'
    });
    done();
  });
  
  it('empty object for when no file', function (done) {
    
    var data = loadConfigFile('.tmp/nope.json');
    expect(data).to.eql({});
    done();
  });
  
  it('loads object as config', function (done) {
    
    var config = loadConfigFile({
      my: 'data'
    });
    
    expect(config).to.eql({
      my: 'data'
    });
    done();
  });
  
  it('extends the file config with the object passed', function (done) {
    
    fs.outputFileSync('superstatic.json', '{"name": "superstatic"}', 'utf-8');
    
    var config = loadConfigFile({
      override: 'test'
    });
    
    expect(config).to.eql({
      name: 'superstatic',
      override: 'test'
    });
    
    fs.removeSync('superstatic.json');
    done();
  });
});