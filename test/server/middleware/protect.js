var setup = require('./_setup');
var expect = require('expect.js');
var sinon = require('sinon');
var protect = require('../../../lib/server/middleware/protect');

describe('protect middleware', function() {
  beforeEach(function () {
    this.protect = protect();
    setup.configure(this);
    
    this.req.settings.build = {
      env: {
        config: {
          auth: 'username:password'
        }
      }      
    };
  });
  
  it('parses the basic auth header', function () {
    this.req.headers.authorization = 'Basic ' + new Buffer('username:password').toString('base64');
    expect(protect.auth(this.req, this.res, this.next)).to.equal('username:password');
  });
  
  it('ignores auth headers if non exist', function () {
    this.req.headers.authorization = undefined;
    expect(protect.auth(this.req)).to.equal(undefined);
  });
  
  it('skips middleware if environment is not protected', function () {
    this.req.settings.build = { env: { config: { auth: undefined } } };
    this.protect(this.req, this.res, this.next);
    expect(this.next.called).to.be(true);
  });
  
  it('skips middleware if there is no build for this environment', function () {
    this.req.settings.build = undefined;
    this.protect(this.req, this.res, this.next);
    expect(this.next.called).to.be(true);
  });
  
  it('requires http basic auth when environment is protected', function () {
    this.protect(this.req, this.res, this.next);
    expect(this.res.statusCode).to.equal(401);
    expect(this.res.setHeader.calledWith('WWW-Authenticate', 'Basic realm="Secure Area"')).to.equal(true);
    expect(this.res.end.called).to.equal(true);
  });
  
  it('authorizes request if basic auth credentials match enviroment credentials', function () {
    this.req.headers.authorization = 'Basic ' + new Buffer('username:password').toString('base64');
    this.protect(this.req, this.res, this.next);
    expect(protect.auth(this.req)).to.equal('username:password');
    expect(this.next.called).to.equal(true);
  });
  
  it('requires authentication if auth is provided invalid credentials', function () {
    this.req.headers.authorization = 'Basic ' + new Buffer('username:notpassword').toString('base64');
    this.protect(this.req, this.res, this.next);
    expect(this.res.statusCode).to.equal(401);
    expect(this.res.setHeader.calledWith('WWW-Authenticate', 'Basic realm="Secure Area"')).to.equal(true);
    expect(this.res.end.called).to.equal(true);
  });
});