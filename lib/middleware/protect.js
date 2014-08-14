// TODO: convert to use https://www.npmjs.org/package/basic-auth module
// or even replace this whole module with https://www.npmjs.org/package/basic-auth-connect

var protect = function (settings) {
  return  function (req, res, next) {
    var auth = protect.auth(req);
    var envConfig = protect.envConfig(settings);
    
    if (!envConfig || !envConfig.auth) return next();
    if (!auth) return protect.notAuth(res, 'Not Authorized');
    if (auth !== envConfig.auth) return protect.notAuth(res, 'Invalid Credentials');
    
    next();
  };
};

protect.auth = function (req) {
  var auth = req.headers['authorization'];
  
  if (auth) {
    var encryptedAuth = auth.split(' ')[1];
    if (encryptedAuth) auth = new Buffer(encryptedAuth, 'base64').toString();
  }
  
  return auth;
};

protect.envConfig = function (settings) {
  return (settings.build && settings.build.env)
    ? settings.build.env.config
    : undefined;
};

protect.notAuth = function (res, msg) {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
  res.end(msg);
};

module.exports = protect;