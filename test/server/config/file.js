var path = require('path');
var expect = require('expect.js');
var sinon = require('sinon');
var File = require('../../../lib/server/config/file');
var CWD = path.resolve(__dirname, '../../fixtures/sample_app');
var fileOptions = {
  // file: 'superstatic.json',
  cwd: CWD
};

describe('File - local settings', function() {
  beforeEach(function () {
    this.file = new File(fileOptions);
  });
  
  it('uses "superstatic.json" as the default config file', function () {
    expect(this.file.file).to.be('superstatic.json');
  });
  
  it('loads the config file on instantiation', function () {
    expect(this.file.configuration).to.have.keys(['name', 'root', 'files']);
  });
  
  it('loads the configuration file', function () {
    var configFile = this.file.loadConfigurationFile();
    expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
  });
  
  it('loads the file list', function () {
    var config = this.file.loadConfigurationFile();
    var fileList = this.file.loadFileList(config);
    expect(fileList).to.be.an('array');
    expect(fileList).to.contain('/index.html');
  });
  
  it('loads a server config object', function (done) {
    this.file.load(null, function (err, config) {
      expect(config).to.have.keys(['root', 'cwd', 'config']);
      done();
    });
  });
})