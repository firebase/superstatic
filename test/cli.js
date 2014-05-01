var expect = require('expect.js');
var cli = require('../lib/cli');
var request = require('supertest');

describe('command line interface', function(){

  it('exposes an event emitter', function(){
    expect(cli._events).to.be.an('object');
  });

  it('exposes a "run" function', function(){
    expect(cli.run).to.be.a('function');
  });

  it('starts a server when run with no arguments', function(done){
    var server;

    cli.on('data', function(data){
      expect(data).to.equal("Server started on port 3474");
    });

    cli.run([], function(server){
      server = server;
      expect(server).to.be.an('object');
      
      request('http://localhost:3474').get('/').end(function(err, res){
        expect(err).to.not.exist;
        expect(res.status).to.equal(404);
        server.stop(done);
      });
    });

  });

});
