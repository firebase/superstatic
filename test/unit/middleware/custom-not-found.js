var fs = require('fs-extra');
var request = require('supertest');
var connect = require('connect');
var query = require('connect-query');
var join = require('join-path');

var customNotFound = require('../../../lib/middleware/custom-not-found');
var dfs = require('../../../lib/dfs');
var responder = require('../../../lib/responder');

describe('custom not found', function () {

  var provider = dfs({
    root: '.tmp'
  });
  var app;

  beforeEach(function () {

    fs.outputFileSync('.tmp/not-found.html', 'custom not found file', 'utf8');

    app = connect()
      .use(function (req, res, next) {

        responder({
          req: req,
          res: res,
          provider: provider
        });
        next();
      })
  });

  afterEach(function () {

    fs.removeSync('.tmp');
  });

  it('serves the file', function (done) {

    app
      .use(customNotFound({
        config: {
          error_page: '/not-found.html'
        }
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('custom not found file')
      .end(done);
  });

  it('skips middleware on file serve error', function (done) {

    app
      .use(customNotFound({
        config: {
          error_page: '/does-not-exist.html'
        }
      }))
      .use(function (req, res, next) {

        res.__.send('does not exist');
      });

    request(app)
      .get('/anything')
      .expect('does not exist')
      .end(done);
  });

  it('caches for 6 months', function (done) {

    app
      .use(customNotFound({
        config: {
          error_page: '/not-found.html'
        }
      }));

    request(app)
      .get('/anything')
      .expect(404)
      .expect('Cache-Control', 'public, max-age=' + (60 * 60 * 24 * 30 * 6))
      .end(done);
  });
});
