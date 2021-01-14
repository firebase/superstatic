const basicAuth = require("basic-auth-connect");

module.exports = function(spec) {
  return function(req, res, next) {
    const config = req.superstatic;

    if (spec.protect || config.protect) {
      return basicAuth.apply(
        basicAuth,
        (spec.protect || config.protect).split(":")
      )(req, res, next);
    }

    return next();
  };
};
