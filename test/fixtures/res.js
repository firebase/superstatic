var sinon = require('sinon');

module.exports = {
  writeHead: sinon.spy(),
  end: sinon.spy()
};