/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var _ = require('lodash');
var fs = require('fs-extra');
var request = require('request');
var expect = require('chai').expect;

var makecli = require('../../../lib/cli');
var server;

describe('cli', function() {
  var cli;

  var config = {
    public: './'
  };

  beforeEach(function() {
    cli = makecli();

    fs.outputFileSync('superstatic.json', JSON.stringify(config), 'utf-8');
    fs.outputFileSync('.tmp/superstatic.json', JSON.stringify(config), 'utf-8');
    fs.outputFileSync('.tmp/index.html', '.tmp/index.html', 'utf-8');
    fs.outputFileSync('index.html', 'index', 'utf-8');
  });

  afterEach(function() {
    fs.removeSync('superstatic.json');
    fs.removeSync('index.html');
    fs.removeSync('.tmp');
  });

  it('starts a server', function(done) {
    cli.run(['', ''], function() {
      server = cli.get('server');
      var port = cli.get('port');

      request('http://localhost:' + port, function(err, response, body) {
        expect(err).to.equal(null);
        expect(response.statusCode).to.equal(200);
        expect(body).to.equal('index');
        server.close(done);
      });
    });
  });

  it('starts a server with a given directory', function(done) {
    cli.run(['', '', '.tmp'], function() {
      server = cli.get('server');
      var port = cli.get('port');

      request('http://localhost:' + port, function(err, response, body) {
        expect(response.statusCode).to.equal(200);
        expect(body).to.equal('.tmp/index.html');
        server.close(done);
      });
    });
  });

  it('loads firebase.json config file', function(done) {
    fs.unlinkSync('superstatic.json');
    fs.writeFileSync('firebase.json', JSON.stringify({
      public: '.tmp'
    }), 'utf-8');

    cli.run(['', ''], function() {
      server = cli.get('server');
      var port = cli.get('port');

      request('http://localhost:' + port, function(err, response, body) {
        expect(body).to.equal('.tmp/index.html');

        fs.unlinkSync('firebase.json');
        server.close(done);
      });
    });
  });

  describe('port', function() {
    it('--port', function(done) {
      cli.run(['', '', '--port', '4321'], function() {
        server = cli.get('server');
        var port = cli.get('port');

        request('http://localhost:' + port, function(err) {
          expect(err).to.equal(null);
          expect(port).to.equal(4321);
          server.close(done);
        });
      });
    });

    it('-p', function(done) {
      cli.run(['', '', '-p', '4321'], function() {
        server = cli.get('server');
        var port = cli.get('port');

        request('http://localhost:' + port, function(err) {
          expect(err).to.equal(null);
          expect(port).to.equal(4321);
          server.close(done);
        });
      });
    });
  });

  describe('starts server on host', function() {
    it('--host', function(done) {
      cli.run(['', '', '--host', '0.0.0.0'], function() {
        server = cli.get('server');

        expect(server.address().address).to.equal('0.0.0.0');
        server.close(done);
      });
    });

    it('--hostname', function(done) {
      cli.run(['', '', '--hostname', '0.0.0.0'], function() {
        server = cli.get('server');

        expect(server.address().address).to.equal('0.0.0.0');
        server.close(done);
      });
    });
  });

  it('enables log output', function(done) {
    cli.run(['', '', '--debug'], function() {
      var app = cli.get('app');
      var hasLogger = _.find(app.stack, function(layer) {
        return layer.handle && layer.handle.name === 'logger';
      });

      expect(cli.get('debug')).to.equal(true);
      expect(!!hasLogger).to.equal(true);
      cli.get('server').close(done);
    });
  });

  it('enables gzipping', function(done) {
    cli.run(['', '', '--gzip'], function() {
      expect(cli.get('gzip')).to.equal(true);
      cli.get('server').close(done);
    });
  });

  describe('uses custom config', function() {
    beforeEach(function() {
      fs.writeFileSync('custom.json', JSON.stringify({
        public: './',
        rewrites: [{
          source: '**',
          destination: '/index.html'
        }]
      }, null, 2), 'utf-8');
    });

    afterEach(function() {
      fs.unlinkSync('custom.json');
    });

    it('--config', function(done) {
      cli.run(['', '', '--config', 'custom.json'], function() {
        request('http://localhost:3474/anything.html', function(err, response, body) {
          expect(body).to.equal('index');
          expect(cli.get('config')).to.equal('custom.json');

          cli.get('server').close(done);
        });
      });
    });

    it('-c', function(done) {
      cli.run(['', '', '-c', 'custom.json'], function() {
        request('http://localhost:3474/anything.html', function(err, response, body) {
          expect(body).to.equal('index');
          expect(cli.get('config')).to.equal('custom.json');

          cli.get('server').close(done);
        });
      });
    });

    it('uses custom config object', function(done) {
      cli.run(['', '', '--config', JSON.stringify({
        rewrites: [{
          source: '**',
          destination: '/index.html'
        }]
      })], function() {
        request('http://localhost:3474/anything.html', function(err, response, body) {
          expect(body).to.equal('index');
          cli.get('server').close(done);
        });
      });
    });
  });

  // NOTE: can't test flags that exit
  // This should be fixed in Nash 2.0
  it.skip('version flag', function(done) {
    // stdMocks.use();

    cli.run(['', '', '-v'], function() {
      // stdMocks.restore();
      // var output = stdMocks.flush();

      done();
    });
  });

  it('restarts the server if the config file is changed');

  // describe.skip('installing services', function() {

  //   it('locally');
  //   it('globally');
  // });

  describe.skip('services', function() {

  });
});
