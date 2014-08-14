// var clientIp = require('client-ip');
// var mongodbUrl = process.env.TRACKING_MONGODB_URL || 'mongodb://localhost/divshot-tracking-dev';
// var connected = false;
// var Action;
// var mongoose;

// TODO: we don't need this for local dev

module.exports = function (config, shouldTrack) {
  // Connect to db if need be
  // if (shouldTrack && !connected) connect();
  
  return {
    serviceAvailable: function (name, done) {
      done = done || function () {};
      
      if (!shouldTrack) return done(null, true);
      
      // TODO: we will track if services are over
      // once it is out of beta
      
      // var available = config.services
      //   && config.services[name]
      //   && !config.services[name].exceeded;
        
      // done(null, available);
      
      done(null, true);
    },
    
    recordUsage: function (name, req, done) {
      done = done || function () {};
      
      // if (!shouldTrack) return done();
      
      done();
      
      // var action = new Action({
      //   name: name,
      //   request: {
      //     ip: clientIp(req),
      //     host: req.headers.host,
      //     url: req.url,
      //     method: req.method,
      //     'user-agent': req.headers['user-agent']
      //   }
      // });
      
      // action.save(done);
    }
  };
};

// function connect() {
//   mongoose = require('mongoose');
//   mongoose.connect(mongodbUrl);
//   Action = mongoose.model('Action', new mongoose.Schema({
//     name: String,
//     request: {
//       ip: String,
//       host: String,
//       url: String,
//       method: String,
//       'user-agent': String
//     }
//   }, {
//     versionKey: false
//   }));
  
//   connected = true;
// }