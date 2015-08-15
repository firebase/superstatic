var url = require('fast-url-parser');
var locale = require('locale');

module.exports = function (imports) {
  
  var languages = imports.languages;
  var supportedLocales = new locale.Locales(languages);
  locale.Locale["default"] = new locale.Locale(languages[0]);
  
  return function (req, res, next) {

    var pathname = url.parse(req.url).pathname;

    if (pathname === '/' && languages) {
      var requestedLocales = new locale.Locales(req.headers["accept-language"]);
      var matchingLocale = requestedLocales.best(supportedLocales);
      res.__.redirect("/" + matchingLocale.language);

    } else {

      next();
    }

  };
};