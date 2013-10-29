var defaults = exports.defaults = {
  PORT: 3474,
  HOST: '127.0.0.1',
  DIRECTORY: process.cwd(),
  IGNORE: [
    '**/.git/**',
    '**/.git**'
  ]
};

module.exports = defaults;