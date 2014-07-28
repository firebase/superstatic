module.exports = function (config, shouldTrack) {
  return {
    serviceAvailable: function (name) {
      if (!shouldTrack) return true;
      
      return config.services
        && config.services[name]
        && !config.services[name].exceeded;
    },
    
    recordUsage: function (name, data, done) {
      done = done || function () {};
      
      if (!shouldTrack) return done();
        
      done();
    }
  };
};