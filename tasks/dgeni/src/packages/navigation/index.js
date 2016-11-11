var Package = require('dgeni').Package;
var path = require('path');

/**
 * @dgPackage navigation
 * @description Navigation builder package
 */
module.exports = new Package('navigation', [])

  // Add in the real processors for this package
  .processor(require('./processors/navigation'))

  // Add more tag definitions
  .config(function(parseTagsProcessor, getInjectables) {
    parseTagsProcessor.tagDefinitions = parseTagsProcessor.tagDefinitions.concat(getInjectables(require('./tag-defs')));
  })

  // add navigation area mappers
  .config(function(generateNavigationProcessor, getInjectables) {
    generateNavigationProcessor.addMappers(getInjectables(require('./processors/nav-area-mapper')));
  })
;