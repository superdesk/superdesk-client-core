var Package = require('dgeni').Package;

/**
 * @dgPackage examples-ext
 * @description Extensions for the dgeni-packages/examples
 */
module.exports = new Package('examples-ext', [require('dgeni-packages/examples')])

// Add in the real processors for this package
.processor(require('./processors/exampleDependenciesBuilder'))

// add more templates location
.config(function(templateFinder) {
  templateFinder.templateFolders.unshift(path.resolve(__dirname, 'templates'));
})
;