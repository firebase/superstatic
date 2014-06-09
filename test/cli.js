var expect = require('chai').expect;
var request = require('supertest');
var fs = require('fs');
var mkdirp = require('mkdirp');
var cli = require('../lib/cli');

describe('command line interface', function () {
  var cli;
  
  beforeEach(function () {
    cli = require('../lib/cli');
    cli.quiet = false; // TODO: false shouldn't be true
    
    cli.on('error', function (err) {
      console.log(err);
    });
  });
  
  afterEach(function (done) {
    delete require.cache[require.resolve('../lib/cli')];
    
    try {
      cli.server.close(done);
    }
    catch (e) {
      done();
    }
  });
  
  it('starts a server with no arguments', function (done) {
    cli.cwd = process.cwd();
    cli.run([]);
    
    fs.writeFileSync('index.html', 'basic');
    
    cli.on('started', function () {
      request('http://localhost:' + cli.port)
        .get('/')
        .expect(200)
        .expect('basic')
        .end(function (err) {
          fs.unlinkSync(process.cwd() + '/index.html');
          done(err);
        });
    });
  });
  
  it('starts a server in a given directory', function (done) {
    cli.run(['', '', 'custom']);
    
    mkdirp.sync('custom')
    fs.writeFileSync('custom/index.html', 'custom directory');
    
    cli.on('started', function () {
      request('http://localhost:' + cli.port)
        .get('/')
        .expect(200)
        .expect('custom directory')
        .end(function (err) {
          fs.unlinkSync('custom/index.html');
          fs.rmdirSync('custom');
          done(err);
        });
    });
  });
  
  it('starts a server on a different port if --port is passed', function (done) {
    cli.cwd = process.cwd();
    cli.run(['', '', '--port', '3475']);
    
    fs.writeFileSync('index.html', 'basic');
    
    cli.on('started', function () {
      request('http://localhost:3475')
        .get('/')
        .expect(200)
        .expect('basic')
        .end(function (err) {
          fs.unlinkSync(process.cwd() + '/index.html');
          done(err);
        });
    });
  });
  
  it('starts a server at a different host if --host is passed', function (done) {
    cli.run(['', '', '--host', '0.0.0.0']);
    
    cli.on('started', function () {
      expect(cli.server.host).to.equal('0.0.0.0');
      done();
    });
  });
  
  it('quiets logs if --quiet is passed', function () {
    cli.quiet = true;
    cli.run(['', '', '--quiet']);
    expect(cli.quiet).to.equal(false);
  });
  
  it('uses custom config file if --config passed', function (done) {
    fs.writeFileSync('test.json', '{"name": "test"}');
    
    cli.run(['', '', '--config', 'test.json']);
    
    cli.on('started', function () {
      expect(cli.server.settings.configuration.name).to.equal('test');
      fs.unlinkSync('test.json');
      done();
    });
  });
  
  it('uses custom config object if --config passed', function (done) {
    cli.run(['', '', '--config', '{"name": "test"}']);
    
    cli.on('started', function () {
      expect(cli.server.settings.configuration.name).to.equal('test');
      done();
    });
  });
  
  it('restarts the server if the config file is changed');
  it('errors if two servers are started on the same port');
  it('loads a list of services on server start');
  
});

describe.skip('concurrent tasks', function () {
  
  it('runs tasks concurrently', function (done) {
    fs.writeFileSync(__dirname + '/superstatic.json', JSON.stringify({
      scripts: {
        testing: ''
      }
    }, null, 2));
    
    process.cwd = function () {
      return __dirname;
    };
    
    cli.debug = false;
    cli.run(['', '', '--with', 'testing']);
    
    cli.on('started', function () {
      done();
    });
  });
  
});