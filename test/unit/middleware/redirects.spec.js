/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var helpers = require('../../helpers');
var redirect = helpers.decorator(require('../../../lib/middleware/redirects'));
var connect = require('connect');
var request = require('supertest');
var Responder = require('../../../lib/responder');
var patterns = require('../../../lib/utils/patterns');
var setup = function(req, res, next) {
  res.superstatic = new Responder(req, res, {provider: {}});
  next();
};

describe('redirect middleware', function() {
  it('skips the middleware if there are no redirects configured', function(done) {
    var app = connect()
      .use(redirect({redirects: []}));

    request(app)
      .get('/')
      .expect(404)
      .end(done);
  });

  it('skips middleware when there are no matching redirects', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/none')
      .expect(404)
      .end(done);
  });

  it('redirects to a configured path', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });

  it('recognizes glob as synonymous with source', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        glob: '/source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });

  it('redirects to a configured regexp path', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '/source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });

  it('redirects to a configured path with a custom status code', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/source',
        destination: '/redirect',
        type: 302
      }]}));

    request(app)
      .get('/source')
      .expect(302)
      .expect('location', '/redirect')
      .end(done);
  });

  it('adds leading slash to all redirect paths', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: 'source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });

  it('redirects using glob negation', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '!source',
        destination: '/redirect',
        type: 301
      }]}));

    request(app)
      .get('/anthing')
      .expect(301)
      .expect('location', '/redirect')
      .end(done);
  });

  it('redirects using segments in the url path', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/old/:value/path/:loc',
        destination: '/new/:value/path/:loc',
        type: 301
      }]}));

    request(app)
      .get('/old/redirect/path/there')
      .expect(301)
      .expect('location', '/new/redirect/path/there')
      .end(done);
  });

  it('uses capturing groups as segments when given a regex', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '\/old\/(.+)\/group\/(.+)',
        destination: '/new/:1/path/:2',
        type: 301
      }]}));

    request(app)
      .get('/old/capture/group/there')
      .expect(301)
      .expect('location', '/new/capture/path/there')
      .end(done);
  });

  it('handles Unicode codepoints in regexes', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '\/äöü',
        destination: '/aou',
        type: 301
      }]}));

    request(app)
      .get('/äöü')
      .expect(301)
      .expect('location', '/aou')
      .end(done);
  });

  it('percent encodes the redirect location', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '\/aou',
        destination: '/ć',
        type: 301
      }]}));

    request(app)
      .get('/aou')
      .expect(301)
      .expect('location', '/%C4%87')
      .end(done);
  });

  it('redirects using regexp captures inside path segments', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '\/foo\/(.+)bar\/baz',
        destination: '/:1',
        type: 301
      }]}));

    request(app)
      .get('/foo/barbar/baz')
      .expect(301)
      .expect('location', '/bar')
      .end(done);
  });

  it('redirects using regexp captures across path segments', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        regex: '\/foo\/(.+)\/bar',
        destination: '/:1',
        type: 301
      }]}));

    request(app)
      .get('/foo/1/2/3/4/bar')
      .expect(301)
      .expect('location', '/1/2/3/4')
      .end(done);
  });

  if (patterns.re2Available()) {
    it('redirects using RE2 capturing groups', function(done) {
      var app = connect()
        .use(setup)
        .use(redirect({redirects: [{
          regex: '\/(\?P<asdf>foo)\/bar',
          destination: '/:asdf',
          type: 301
        }]}));

      request(app)
        .get('/foo/bar')
        .expect(301)
        .expect('location', '/foo')
        .end(done);
    });

    it('redirects using both named and unnamed capture groups', function(done) {
      var app = connect()
        .use(setup)
        .use(redirect({redirects: [{
          regex: '\/(\?P<asdf>.+)\/(.+)\/(\?P<jkl>.+)',
          destination: '/:asdf/:2/:jkl',
          type: 301
        }]}));

      request(app)
        .get('/mixed/capture/types')
        .expect(301)
        .expect('location', '/mixed/capture/types')
        .end(done);
    });
  }

  it('redirects a missing optional segment', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/old/:value?',
        destination: '/new/:value?',
        type: 301
      }]}));

    request(app)
      .get('/old/')
      .expect(301)
      .expect('location', '/new')
      .end(done);
  });

  it('redirects a present optional segment', function(done) {
    var app = connect()
      .use(setup)
      .use(redirect({redirects: [{
        source: '/old/:value?',
        destination: '/new/:value?',
        type: 301
      }]}));

    request(app)
      .get('/old/derp')
      .expect(301)
      .expect('location', '/new/derp')
      .end(done);
  });

  it('redirects a splat segment', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/blog/:post*',
        destination: '/new/:post*',
        type: 301
      }]}));

    request(app)
      .get('/blog/this/old/post')
      .expect(301)
      .expect('location', '/new/this/old/post')
      .end(done);
  });

  it('redirects using segments in the url path with a 302', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/old/:value/path/:loc',
        destination: '/new/:value/path/:loc',
        type: 302
      }]}));

    request(app)
      .get('/old/redirect/path/there')
      .expect(302)
      .expect('location', '/new/redirect/path/there')
      .end(done);
  });

  it('redirects to external http url', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source',
        destination: 'http://redirectedto.com',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('Location', 'http://redirectedto.com')
      .end(done);
  });

  it('redirects to external https url', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source',
        destination: 'https://redirectedto.com',
        type: 301
      }]}));

    request(app)
      .get('/source')
      .expect(301)
      .expect('Location', 'https://redirectedto.com')
      .end(done);
  });

  it('preserves query params when redirecting', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source',
        destination: '/destination',
        type: 301
      }]}));

    request(app)
      .get('/source?foo=bar&baz=qux')
      .expect(301)
      .expect('Location', '/destination?foo=bar&baz=qux')
      .end(done);
  });

  it('appends query params to the destination when redirecting', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source',
        destination: '/destination?hello=world',
        type: 301
      }]}));

    request(app)
      .get('/source?foo=bar&baz=qux')
      .expect(301)
      .expect('Location', '/destination?hello=world&foo=bar&baz=qux')
      .end(done);
  });

  it('preserves query params when redirecting to external urls', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source',
        destination: 'http://example.com/destination',
        type: 301
      }]}));

    request(app)
      .get('/source?foo=bar&baz=qux')
      .expect(301)
      .expect('Location', 'http://example.com/destination?foo=bar&baz=qux')
      .end(done);
  });

  it('preserves query params when redirecting with captures', function(done) {
    var app = connect()
      .use(setup).use(redirect({redirects: [{
        source: '/source/:foo',
        destination: '/:foo/bar',
        type: 301
      }]}));

    request(app)
      .get('/source/wat?foo=bar&baz=qux')
      .expect(301)
      .expect('Location', '/wat/bar?foo=bar&baz=qux')
      .end(done);
  });
});
