var fs = require('fs');
var setup = require('./_setup');
var expect = setup.expect;
var through = require('through');
var cloneDeep = require('lodash.clonedeep');
var extend = require('lodash.assign');
var responder = require('../../../lib/server/middleware/responder');

describe('#responder() middleware', function() {
  beforeEach(function (done) {
    var self = this;
    
    this.filePath = '.tmp.html';
    this.fileContents = '.tmp.html';
    
    fs.writeFileSync(this.filePath, this.fileContents);
    
    setup.beforeEachMiddleware.call(this, function () {
      self.res = extend(through(), cloneDeep(self.res));
      self.req.superstatic = {path: self.filePath};
      
      self.req.ss.store.get = function (path) {
        var fileStream = fs.createReadStream(path);
        fileStream.type = 'text/html';
        return fileStream;
      };
      
      done();
    });
  });
  
  afterEach(function () {
    fs.unlinkSync(this.filePath);
  });
  
  
  it('sets the content header according the response path', function () {
    responder(this.req, this.res);
    expect(this.res.setHeader.calledWith('Content-Type', 'text/html')).to.be(true);
  });
  
  it('streams the file contents of the response path', function (done) {
    var self = this;
    responder(this.req, this.res);
    
    this.res.on('data', function (chunk) {
      expect(chunk.toString()).to.equal(self.fileContents);
      done();
    });
  });
});