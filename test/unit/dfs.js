/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var join = require('join-path');
var expect = require('chai').expect;
var request = require('supertest');
var concat = require('concat-stream');
var etag = require('etag');

var dfs = require('../../lib/dfs');

describe('default provider', function () {

  var provider;

  beforeEach(function () {

    fs.outputFileSync('.tmp/index.html', 'index file content', 'utf8');
    fs.outputFileSync('.tmp/dir/index.html', 'dir index file content', 'utf8');

    provider = dfs({
      root: '.tmp'
    });
  });

  afterEach(function () {

    fs.removeSync('.tmp');
  });

  it('exists()', function (done) {

    provider.exists('/index.html', function (exists) {

      expect(exists).to.equal(true);
      done();
    });
  });

  it('isFile()', function (done) {

    provider.isFile('/index.html', function (isFile) {

      expect(isFile).to.equal(true);
      done();
    });
  });

  it('isDirectory()', function (done) {

    provider.isDirectory('/dir', function (isDir) {

      expect(isDir).to.equal(true);
      done();
    });
  });


  it('isDirectoryIndex()', function (done) {

    provider.isDirectoryIndex('/dir', function (isIndex) {

      expect(isIndex).to.equal(true);
      done();
    });
  });


  it('asDirectoryIndex()', function (done) {

    expect(provider.asDirectoryIndex('/dir')).to.equal('/dir/index.html');
    done();
  });

  it('createReadStream()', function (done) {

    provider.createReadStream('/index.html')
      .pipe(concat(function (data) {

        expect(data.toString()).to.equal('index file content');
        done();
      }));
  });

  it('stat()', function (done) {

    provider.stat('/index.html', function (err, stats) {

      expect(stats.isDirectory()).to.equal(false);
      expect(stats.isFile()).to.equal(true);
      done();
    });
  });
  
  it('custom current working directory', function (done) {

    var provider = dfs({
      cwd: join(process.cwd(), '.tmp'),
      root: './dir'
    });

    provider.createReadStream('/index.html')
      .pipe(concat(function (data) {

        expect(data.toString()).to.equal('dir index file content');
        done();
      }));
  });

  it('generateEtag() with content', function (done) {

    var etag = provider.generateEtag('testing');

    expect(etag).to.not.equal(undefined);
    expect(typeof etag).to.equal('string');
    done();
  });

  it('generateEtag() with fs.Stats', function (done) {

    var stat = fs.statSync('.tmp/index.html');
    var providerTag = provider.generateEtag(stat);
    var statTag = etag(stat, {weak: false});

    expect(providerTag).to.equal(statTag);
    done();
  });
});
