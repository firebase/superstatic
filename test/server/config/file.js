var path = require('path');
var expect = require('expect.js');
var sinon = require('sinon');
var File = require('../../../lib/server/config/file');
var CWD = path.resolve(__dirname, '../../fixtures/sample_app');
var CWD_DIO = path.resolve(__dirname, '../../fixtures/sample_app_dio');
var fileOptions = {
  file: 'custom.json',
  cwd: CWD
};

describe('File - local settings', function() {
  beforeEach(function () {
    this.file = new File(fileOptions);
  });
  
  it('has a list of default config file names', function () {
    expect(this.file._configFileNames).to.contain('superstatic.json', 'divshot.json');
  });
  
  it('adds the custom config file name to the config file name list', function () {
    expect(this.file._configFileNames).to.contain('custom.json');
  });
  
  it('adds the custom config file to the beginning of the config file list', function () {
    expect(this.file._configFileNames[0]).to.be('custom.json');
  });
  
  it('loads the config file on instantiation', function () {
    expect(this.file.configuration).to.have.keys(['name', 'root', 'files']);
  });
  
  describe('loading configuration file', function() {
    it('loads the config file named superstatic.json', function () {
      var file= new File({
        cwd: CWD
      });
      
      var configFile = file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
    
    it('loads the config file named divshot.json', function () {
      var file= new File({
        cwd: CWD_DIO
      });
      
      var configFile = file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
    
    it('loads the config file named custom.json', function () {
      var file= new File({
        file: 'custom.json',
        cwd: CWD_DIO
      });
      
      var configFile = file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
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