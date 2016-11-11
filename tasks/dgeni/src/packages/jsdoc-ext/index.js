var Package = require('dgeni').Package;

/**
 * @dgPackage jsdoc-ext
 * @description Extensions for the dgeni-packages/jsdoc
 */
module.exports = new Package('jsdoc-ext', [require('dgeni-packages/jsdoc')])

// Add in the real processors for this package

// Add more tag definitions
.config(function(parseTagsProcessor, getInjectables) {
  parseTagsProcessor.tagDefinitions = parseTagsProcessor.tagDefinitions.concat(getInjectables(require('./tag-defs')));
});