/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs-extra');
var expect = require('chai').expect;

var loadConfigFile = require('../../../lib/loaders/config-file');

describe('loading config files', function() {
  beforeEach(function() {
    fs.outputFileSync('.tmp/file.json', '{"key": "value"}', 'utf-8');
    fs.outputFileSync('.tmp/package.json', JSON.stringify({
      superstatic: {
        key: 'value'
      }
    }));
  });

  afterEach(function() {
    fs.removeSync('.tmp');
  });

  it('filename', function(done) {
    var data = loadConfigFile('.tmp/file.json');

    expect(data).to.eql({
      key: 'value'
    });
    done();
  });

  it('loads first existing file in array', function(done) {
    var data = loadConfigFile(['another.json', '.tmp/file.json']);

    expect(data).to.eql({
      key: 'value'
    });
    done();
  });

  it('empty object for when no file', function(done) {
    var data = loadConfigFile('.tmp/nope.json');
    expect(data).to.eql({});
    done();
  });

  it('loads object as config', function(done) {
    var config = loadConfigFile({
      my: 'data'
    });

    expect(config).to.eql({
      my: 'data'
    });
    done();
  });

  describe('extends the file config with the object passed', function() {
    it('superstatic.json', function(done) {
      fs.outputFileSync('superstatic.json', '{"firebase": "superstatic", "public": "./"}', 'utf-8');

      var config = loadConfigFile({
        override: 'test',
        public: 'app'
      });

      expect(config).to.eql({
        firebase: 'superstatic',
        override: 'test',
        public: 'app'
      });

      fs.removeSync('superstatic.json');
      done();
    });

    it('firebase.json', function(done) {
      fs.outputFileSync('firebase.json', '{"firebase": "example", "public": "./"}', 'utf-8');

      var config = loadConfigFile({
        override: 'test',
        public: 'app'
      });

      expect(config).to.eql({
        firebase: 'example',
        override: 'test',
        public: 'app'
      });

      fs.removeSync('firebase.json');
      done();
    });
  });
});
