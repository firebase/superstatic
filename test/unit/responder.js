/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */


var fs = require('fs-extra');
var expect = require('chai').expect;
var request = require('supertest');
var connect = require('connect');
var etag = require('etag');

var dfs = require('../../lib/dfs');
var responder = require('../../lib/responder');

var INDEX_HTML_MD5 = 'eca7c31f0d0a3715a19d384323c93a9d';

describe('responder', function () {

  var provider = dfs({
    root: '.tmp'
  });
  var app;

  beforeEach(function () {

    fs.outputFileSync('.tmp/index.html', 'index file content', 'utf8');
    fs.outputFileSync('.tmp/style.css', 'body{}', 'utf8');
    fs.outputFileSync('.tmp/app.js', 'console.log("app")', 'utf8');

    app = connect()
      .use(function (req, res, next) {

        responder({
          req: req,
          res: res,
          provider: provider
        });
        next();
      });
  });

  afterEach(function () {

    fs.removeSync('.tmp');
  });

  it('throws error when no response object is given', function (done) {

    expect(function () {
      responder();
    }).to.throw(TypeError);

    done();
  });

  it('throws error when no provider is given', function (done) {

    expect(function () {
      responder({res: {}});
    }).to.throw(TypeError);

    done();
  });

  describe('send()', function () {

    it('sets content length', function (done) {

      app.use(function (req, res) {

        res.__.send('some text');
      });

      request(app)
        .get('/')
        .expect('Content-Length', 9)
        .end(done);
    });

    it('text defaults as html', function (done) {

      app.use(function (req, res) {

        res.__.send('some text');
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(done);
    });

    it('sends object as json', function (done) {

      app.use(function (req, res) {

        res.__.send({
          key: 'value',
          key2: function () {}
        });
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .end(done);
    });

    describe('etag', function () {

      it('matches', function (done) {

        var etag = 'my-etag';

        app.use(function (req, res) {

          res.setHeader('ETag', etag);

          res.__.send('some text');
        });

        request(app)
          .get('/')
          .set('if-none-match', etag)
          .expect(304)
          .expect(function (data) {

            var headers = data.res.headers;

            expect(headers['content-type']).to.equal(undefined);
            expect(headers['content-length']).to.equal(undefined);
            expect(headers['transfer-encoding']).to.equal(undefined);
          })
          .end(done);
      });

      it('not matching', function (done) {

        app.use(function (req, res) {

          res.__.send('some text');
        });

        request(app)
          .get('/')
          .set('if-none-match', 'old-etag')
          .expect(200)
          .expect('some text')
          .expect('ETag', etag('some text', {weak: false}))
          .end(done);
      });

      it('on HEAD request', function (done) {

        app.use(function (req, res) {

          res.__.send('some text');
        });

        request(app)
          .head('/')
          .expect(200)
          .expect(function (data) {

            expect(data.res.headers.etag).to.not.equal(undefined);
          })
          .end(done);
      });
    });
  });

  describe('sendFile()', function () {

    describe('etag', function () {

      it('matches', function (done) {

        var etag = INDEX_HTML_MD5;

        app.use(function (req, res) {

          res.setHeader('ETag', etag);
          res.__.sendFile('/index.html');
        });

        request(app)
          .get('/')
          .set('if-none-match', etag)
          .expect(304)
          .expect(function (data) {

            var headers = data.res.headers;

            expect(headers['content-type']).to.equal(undefined);
            expect(headers['content-length']).to.equal(undefined);
            expect(headers['transfer-encoding']).to.equal(undefined);
          })
          .end(done);
      });

      it('not matching', function (done) {

        var stat = fs.statSync('.tmp/index.html');

        app.use(function (req, res) {

          res.__.sendFile('/index.html');
        });

        request(app)
          .get('/')
          .set('if-none-match', 'old-etag')
          .expect(200)
          .expect('index file content')
          .expect('ETag', INDEX_HTML_MD5)
          .end(done);
      });

      it('on HEAD request', function (done) {

        var stat = fs.statSync('.tmp/index.html');

        app.use(function (req, res) {

          res.__.sendFile('/index.html');
        });

        request(app)
          .head('/')
          .expect(200)
          .expect('ETag', INDEX_HTML_MD5)
          .end(done);
      });
    });

    it('html', function (done) {

      app.use(function (req, res) {

        res.__.sendFile(req.url);
      });

      request(app)
        .get('/index.html')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect('Content-Length', 18)
        .expect('index file content')
        .end(done);
    });

    it('css', function (done) {

      app.use(function (req, res) {

        res.__.sendFile(req.url);
      });

      request(app)
        .get('/style.css')
        .expect('Content-Type', 'text/css; charset=utf-8')
        .expect('Content-Length', 6)
        .expect('body{}')
        .end(done);
    });

    it('js', function (done) {

      app.use(function (req, res) {

        res.__.sendFile(req.url);
      });

      request(app)
        .get('/app.js')
        .expect('Content-Type', 'application/javascript; charset=utf-8')
        .expect('Content-Length', 18)
        .expect('console.log("app")')
        .end(done);
    });

    it('missing directory index', function (done) {

      var provider = dfs({
        root: './'
      });

      app = connect()
        .use(function (req, res, next) {

          responder({
            res: res,
            provider: provider
          });
          next();
        })
        .use(function (req, res, next) {

          res.__.sendFile(req.url)
            .on('error', function () {

              next();
            });
        });

      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });

    it('ensure "/" is always "/index.html"', function (done) {

      var provider = dfs({
        root: './'
      });

      app = connect()
        .use(function (req, res, next) {

          responder({
            res: res,
            provider: provider
          });
          next();
        })
        .use(function (req, res, next) {

          res.__.sendFile('/')
            .on('error', function () {

              next();
            });
        });

      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });

    it('emits error event', function (done) {

      var errorCalled = false;

      app.use(function (req, res) {

        res.__.sendFile(req.url)
          .on('error', function (err) {

            errorCalled = true;
            res.end();
          });
      });

      request(app)
        .get('/does-not-exist.html')
        .expect(function () {

          expect(errorCalled).to.equal(true);
        })
        .end(done);
    });

    it('emits headers event', function (done) {

      var headersEventCalled = false;

      app.use(function (req, res) {

        res.__.sendFile(req.url)
          .on('headers', function (err) {

            headersEventCalled = true;
          });
      });

      request(app)
        .get('/index.html')
        .expect(function () {

          expect(headersEventCalled).to.equal(true);
        })
        .end(done);
    });
  });

  describe('ext()', function () {

    it('sets content type by extension name', function (done) {

      app.use(function (req, res) {

        res
          .__.ext('js')
          .__.send('console.log("js")');
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'application/javascript; charset=utf-8')
        .end(done);
    });

    it('sets content type by file name with extension', function (done) {

      app.use(function (req, res) {

        res
          .__.send('console.log("js")')
          .__.ext('app.js');
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'application/javascript; charset=utf-8')
        .end(done);
    });
  });

  it('status()', function (done) {

    app.use(function (req, res) {

      res
        .__.status(301)
        .end();
    });

    request(app)
      .get('/')
      .expect(301)
      .end(done);
  });

  describe('redirect()', function () {

    it('301', function (done) {

      app.use(function (req, res) {

        res.__.redirect('/test');
      });

      request(app)
        .get('/')
        .expect(301)
        .expect('Location', '/test')
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect('Redirecting to /test ...')
        .end(done);
    });

    it('custom status', function (done) {

      app.use(function (req, res) {

        res.__.redirect('/test', 302);
      });

      request(app)
        .get('/')
        .expect(302)
        .expect('Location', '/test')
        .end(done);
    });
  });
});
