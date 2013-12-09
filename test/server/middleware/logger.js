var setup = require('./_setup');
var expect = setup.expect;
var logger = require('../../../lib/server/middleware/logger');
var sinon = require('sinon');

describe('#logger()', function() {
  var req = {
    headers: {
      host: 'host'
    },
    url: 'url'
  };
  
  it('does not print out anything of logging is not flagged', function () {
    var printSpy = sinon.spy();
    var print = logger(false, printSpy);
    print(req, {}, function () {});
    
    expect(printSpy.called).to.be(false);
  });
  
  it('prints out formatted log to console if logging is flagged true', function () {
    var printSpy = sinon.spy();
    var print = logger(true, printSpy);
    print(req, {}, function () {});
    
    expect(printSpy.called).to.be(true);
  });
})