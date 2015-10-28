/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var expect = require('chai').expect;

var loadConfigFile = require('../../../lib/loaders/config-file');

describe('loading config files', function () {
  
  beforeEach(function () {
    
    fs.outputFileSync('.tmp/file.json', '{"key": "value"}', 'utf-8');
    fs.outputFileSync('.tmp/package.json', JSON.stringify({
      superstatic: {
        key: 'value'
      }
    }));
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
  
  it.skip('from package.json - superstatic', function (done) {
    
    var data = loadConfigFile('.tmp/package.json');
    
    expect(data).to.eql({
      key: 'value'
    });
    done();
  });
  
  it.skip('from package.json - divshot', function (done) {
    
    fs.outputFileSync('.tmp/package.json', JSON.stringify({
      divshot: {
        key1: 'value1'
      }
    }));
    
    var data = loadConfigFile('.tmp/package.json');
    
    expect(data).to.eql({
      key1: 'value1'
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
  
  describe('extends the file config with the object passed', function () {
    
    it('superstatic.json', function (done) {
      
      fs.outputFileSync('superstatic.json', '{"name": "superstatic", "root": "./"}', 'utf-8');
      
      var config = loadConfigFile({
        override: 'test',
        root: 'app'
      });
      
      expect(config).to.eql({
        name: 'superstatic',
        override: 'test',
        root: 'app'
      });
      
      fs.removeSync('superstatic.json');
      done();
    });
    
    it('superstatic.json', function (done) {
      
      fs.outputFileSync('divshot.json', '{"name": "divshot", "root": "./"}', 'utf-8');
      
      var config = loadConfigFile({
        override: 'test',
        root: 'app'
      });
      
      expect(config).to.eql({
        name: 'divshot',
        override: 'test',
        root: 'app'
      });
      
      fs.removeSync('divshot.json');
      done();
    });
  });
});