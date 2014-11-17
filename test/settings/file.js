var path = require('path');
var expect = require('chai').expect;
var File = require('../../lib/settings/file');
var CWD = path.resolve(__dirname, '../fixtures/sample_app');
var CWD_DIO = path.resolve(__dirname, '../fixtures/sample_app_dio');
var CWD_CUSTOM = path.resolve(__dirname, '../fixtures/sample_app_custom');

describe('settings', function() {
  beforeEach(function () {
    this.file = new File({
      config: 'custom.json', 
      cwd: CWD
    });
  });
  
  it('has a list of default config file names', function () {
    expect(this.file._configFileNames).to.contain('superstatic.json', 'divshot.json');
  });
  
  it('adds the custom config file name to the config file name list', function () {
    expect(this.file._configFileNames).to.contain('custom.json');
  });
  
  it('adds the custom config file to the beginning of the config file list', function () {
    expect(this.file._configFileNames[0]).to.equal('custom.json');
  });
  
  it('loads the config file on instantiation', function () {
    expect(this.file.configuration).to.contain.keys(['name', 'root']);
  });
  
  describe('loading configuration file', function() {
    it('loads the config file named superstatic.json', function () {
      var file = new File({cwd: CWD});
      
      var configFile = file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
    
    it('loads the config file named divshot.json', function () {
      var file = new File({cwd: CWD_DIO});
      
      var configFile = file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
    
    it('loads the config file named custom.json', function () {
      var _file = new File({
        config: 'custom.json',
        cwd: CWD_CUSTOM
      });
      
      var configFile = _file.loadConfigurationFile();
      expect(configFile).to.have.keys(['name', 'root', 'clean_urls']);
    });
  });
  
  it('determines of a given file path is a file', function () {
    expect(this.file.isFile('/index.html')).to.equal(true);
    expect(this.file.isFile('/dir')).to.equal(false);
    expect(this.file.isFile('/file.html')).to.equal(false);
  });
  
  it('loads a server config object', function (done) {
    this.file.load(null, function (err, config) {
      expect(config).to.contain.keys(['root', 'cwd', 'config']);
      done();
    });
  });
  
  it('overrides config values with values passed to the constructor', function () {
    var config = {
      name: 'override',
      root: './'
    }
    
    var file = new File({config: config});
    
    expect(file.configuration).to.eql(config);
  });
  
  it('throws an error if config file is invalid', function () {
    expect(function testLoadConfigurationFile () {
      var file = new File({
        config: 'invalid-config.json',
        cwd: CWD
      });
    }).to.throw(Error);
  });
});