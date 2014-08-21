var logger = require('../../lib/middleware/logger');
var connect = require('connect');
var expect = require('chai').expect;
var request = require('supertest');

describe('logger middleware', function () {
  
  it('skips middleware if #req.log() is already defined', function (done) {
    var overwritten = false;
    var app = connect()
      .use(function (req, res, next) {
        req.log = {
          info: function (msg) {
            overwritten = msg;
          }
        };
        next();
      })
      .use(logger(true))
      .use(function (req, res, next) {
        req.log.info('testing')
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(overwritten).to.equal('testing');
      })
      .end(done);
  });
  
  it('provides an info logging function', function (done) {
    var hasInfoFunction = false;
    var printedMessage = false;
    var app = connect()
      .use(logger(true, {
        info: function (msg) {
          printedMessage = msg;
        }
      }))
      .use(function (req, res, next) {
        if (req.log.info) hasInfoFunction = true;
        req.log.info('info');
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(hasInfoFunction).to.equal(true);
        expect(printedMessage).to.equal('info');
      })
      .end(done);
  });
  
  it('provides an info logging function', function (done) {
    var hasWarnFunction = false;
    var printedMessage = false;
    var app = connect()
      .use(logger(true, {
        warn: function (msg) {
          printedMessage = msg;
        }
      }))
      .use(function (req, res, next) {
        if (req.log.warn) hasWarnFunction = true;
        req.log.warn('warn');
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(hasWarnFunction).to.equal(true);
        expect(printedMessage).to.equal('warn');
      })
      .end(done);
  });
  
  it('provides an info logging function', function (done) {
    var hasErrorFunction = false;
    var printedMessage = false;
    var app = connect()
      .use(logger(true, {
        error: function (msg) {
          printedMessage = msg;
        }
      }))
      .use(function (req, res, next) {
        if (req.log.error) hasErrorFunction = true;
        req.log.error('error');
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(hasErrorFunction).to.equal(true);
        expect(printedMessage).to.equal('error');
      })
      .end(done);
  });
  
  it('skips printing to logger if debugging is turned off', function (done) {
    var printedMessage = false;
    var app = connect()
      .use(logger(false, {
        info: function (msg) {
          printedMessage = msg;
        }
      }))
      .use(function (req, res, next) {
        req.log.info('info');
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(printedMessage).to.equal(false);
      })
      .end(done);
  });
  
  it('makes methods chainable', function (done) {
    var info;
    var warn;
    var error;
    var app = connect()
      .use(logger(false))
      .use(function (req, res, next) {
        info = req.log.info('info');
        warn = req.log.warn('warn');
        error = req.log.error('error');
        next();
      });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(info.info).to.not.equal(undefined);
        expect(warn.warn).to.not.equal(undefined);
        expect(error.error).to.not.equal(undefined);
      })
      .end(done);
  });
  
  it('skips logging if function is not defined on logger object', function (done) {
    var app = connect()
      .use(logger(true, {}))
      .use(function (req, res, next) {
        req.log
          .info('info')
          .warn('warn')
          .error('error')
        next();
      });
    
    request(app)
      .get('/')
      .end(done);
  });
  
});