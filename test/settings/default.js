var expect = require('chai').expect;
var defaultSettings = require('../../lib/settings/default');


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
  
  it('can set the root current working directory', function () {
    obj._rootCwd = process.cwd();
    expect(obj.rootPathname('path')).to.equal(process.cwd() + '/path');
  });
});