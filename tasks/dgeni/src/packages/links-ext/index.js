var Package = require('dgeni').Package;

/**
 * @dgPackage links-ext
 */
module.exports = new Package('links-ext', [require('dgeni-packages/links')])

.factory(require('./services/link-info'))

.config(function(getLinkInfo, getInjectables) {
    getLinkInfo.externalLinks = getInjectables(require('./services/links'));
})

.config(function(inlineTagProcessor, getInjectables) {
  inlineTagProcessor.inlineTagDefinitions = inlineTagProcessor.inlineTagDefinitions.concat(getInjectables(require('./inline-tag-defs')));
})
;