var defaults = exports.defaults = {
  PORT: 3474,
  HOST: '127.0.0.1',
  DIRECTORY: process.cwd(),
  DEBUG: true,
  SERVICES: {},
  SERVICES_ROUTE_PREFIX: '__'
};

module.exports = defaults;