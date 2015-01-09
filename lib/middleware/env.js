var fs = require('fs');

var template = fs.readFileSync(__dirname + '/../assets/env.js.template').toString();

module.exports = function (imports) {
  
  var envData = imports.data || {};
  var router = imports.router;
  
  router.get('/__/env.json', function (req, res) {
    
    res.__.send(envData);
  });
  
  router.get('/__/env.js', function (req, res) {
    
    var payload = template.replace("{{ENV}}", JSON.stringify(envData));
    
    res
      .__.send(payload)
      .__.ext('js');
  });
};