module.exports = function (config) {
  return {
    serviceAvailable: function (name) {
      return config.services[name]
        && config.services[name]
        && !config.services[name].exceeded;
    },
    
    recordUsage: function (name, data, done) {
      done = done || function () {};
      done();
    }
  };
};