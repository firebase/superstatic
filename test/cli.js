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

  it('starts a server in a directory if passed a positional arg')
  it('starts a server on a different port if --port is passed')
  it('starts a server at a different host if --host is passed')
  it('quiets logs if --quiet is passed')
  it('uses custom config if --config passed')
  it('restarts the server if the config file is changed')
  it('errors if two servers are started on the same port')

});
