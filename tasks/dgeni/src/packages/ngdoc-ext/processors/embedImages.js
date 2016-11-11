var _ = require('lodash');
var path = require('path');
var mime = require('mime');
var fs = require('fs');

/**
 * @dgProcessor embedImages
 * @description
 * Embeds local images to the page
 */
module.exports = function embedImages(log, aliasMap, moduleMap, createDocMessage) {
  return {
    $runBefore: ['writeFilesProcessor'],
    $process: function(docs) {
      _(docs)
        .groupBy('docType')
        .tap(function(docs){
          // TODO: make exclusions configurable
          // do not embed images references in app templates
          delete docs.website;
        })
        .forEach(function(areas) {
          areas.forEach(function(doc) {
            doc.renderedContent = doc.renderedContent.replace(/(<img.+?src=['"])([^"']+)/ig, function (m0, m1, m2) {
              if (/^https?:\/{2}/.test(m2)) {
                return m1+m2;
              } else {
                log.debug('Found local image %s in %s', m2, doc.id);
                var type = mime.lookup(m2);
                try {
                  return m1+'data:' + type + ';base64,' + fs.readFileSync(path.join(path.dirname(doc.fileInfo.filePath), m2)).toString('base64');
                } catch (e) {
                  log.error('Can\'t read file: %s', e.message);
                  return m1+m2;
                }
              }
            })
          });
        });
    }
  };
};
