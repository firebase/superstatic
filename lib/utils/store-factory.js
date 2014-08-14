var StoreLocal = require('../store/local');
var StoreS3 = require('../store/s3');
var serverDefaults = require('../defaults');

module.exports = function (storeSettings, cwd) {
  if (!storeSettings) return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  if (storeSettings.type === 'local') return new StoreLocal(cwd || serverDefaults.DIRECTORY);
  // if (storeSettings.type === 's3') return new StoreS3(storeSettings.options); 
  if (storeSettings._legacyClient && storeSettings._hashedClient) return new StoreS3(storeSettings);
};