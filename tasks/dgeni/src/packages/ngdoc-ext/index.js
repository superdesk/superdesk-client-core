var Package = require('dgeni').Package;
var path = require('path');

/**
 * @dgPackage ngdoc-ext
 * @description Extensions for the dgeni-packages/ngdoc
 */
module.exports = new Package('ngdoc-ext', [require('dgeni-packages/ngdoc')])

.factory(require('./services/getTypeLink'))

// Add in the real processors for this package
.processor(require('./processors/embedImages'))
.processor(require('./processors/generateErrorsGroupArea'))

// add more templates location
.config(function(templateFinder) {
  templateFinder.templateFolders.unshift(path.resolve(__dirname, 'templates'));
})

// add filters
.config(function(templateEngine, getInjectables) {
  templateEngine.filters = templateEngine.filters.concat(getInjectables([
      require('./rendering/filters/type-link')
  ]));
})
;