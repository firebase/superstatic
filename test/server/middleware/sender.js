var expect = require('expect.js');
var setup = require('./_setup');
var sinon = require('sinon');
var sender = require('../../../lib/server/middleware/sender');
var through = require('through');

describe('sender middleware', function() {
  beforeEach(function () {
    var self = this;
    
    this.sender = sender();
    setup.configure(this);
    
    this.pipeSpy = sinon.spy();
    this.req.ss.store = {
      get: function () {
        return {
          type: 'text/html',
          on: function () {
            return {
              type: 'text/html',
              pipe: self.pipeSpy
            };
          }
        };
      }
    };
  });
  
  it('puts a #send() method on the response object', function () {
    this.sender(this.req, this.res, this.next);
    expect(this.res.send).to.not.equal(undefined);
  });
  
  it('sends a file with no relative path', function (done) {
    var contents = '';
    var url = '../../fixtures/sample_app/index.html';
    
    this.sender(this.req, this.res, this.next);
    this.res.send(url, true)
    
    expect(this.req.url).to.equal(url);
    expect(this.res.end.called).to.equal(true);
    done();
  });
});