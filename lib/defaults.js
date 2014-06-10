var defaults = exports.defaults = {
  PORT: process.env.PORT || 3474,
  HOST: process.env.HOST || '127.0.0.1',
  DIRECTORY: process.cwd(),
  DEBUG: true,
  SERVICES: {},
  SERVICES_ROUTE_PREFIX: '__'
};

module.exports = defaults;