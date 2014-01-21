var path = require('path');
var expect = require('expect.js');
var sinon = require('sinon');
var File = require('../../../lib/server/settings/file');
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
    expect(this.file.configuration).to.have.keys(['name', 'root']);
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
  
  it('determines of a given file path is a file', function () {
    expect(this.file.isFile('/index.html')).to.be(true);
    expect(this.file.isFile('/dir')).to.be(false);
    expect(this.file.isFile('/file.html')).to.be(false);
  });
  
  it('loads a server config object', function (done) {
    this.file.load(null, function (err, config) {
      expect(config).to.have.keys(['root', 'cwd', 'config']);
      done();
    });
  });
  
  it('overrides config values with values passed to the constructor', function () {
    var options = {
      config: {
        name: 'override',
        root: './'
      }
    };
    
    var file = new File(options);
    
    expect(file.configuration).to.eql(options.config);
  });
});