var expect = require('expect.js');
var defaultSettings = require('../../../lib/server/settings/default');


describe('default settings', function() {
  var obj;
  
  beforeEach(function () {
    obj = {value1: 'value1'};
    defaultSettings.mixInto(obj);
  });
  
  it('mixes into another object', function () {
    expect(obj.value1).to.equal('value1');
    expect(obj.load).to.be.a('function');
  });
  
  it('loads a blank configuration', function () {
    expect(obj.load).to.be.a('function');
  });
  
  it('default file exists', function () {
    expect(obj.isFile()).to.equal(true);
  });
  
  it('gets the default root pathname', function () {
    expect(obj.rootPathname('path')).to.equal('/path');
  });
  
  it('gets the default working path', function () {
    expect(obj.workingPathname('path')).to.equal('/path');
  });
});