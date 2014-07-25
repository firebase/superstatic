module.exports = function (config) {
  return {
    serviceAvailable: function (name) {
      return true;
    },
    
    recordUsage: function (name, data, done) {
      done = done || function () {};
      done();
    }
  };
};