var Package = require('dgeni').Package;
var path = require('path');

/**
 * @dgPackage website
 * @description Package builds web app with generated docs
 */
module.exports = new Package('website', [require('../navigation'), require('../search')])

  // Add in the real processors for this package
  .processor(require('./processors/computePaths'))
  .processor(require('./processors/config'))
  .processor(require('./processors/website'))

  // add more templates location and matching patterns
  .config(function(templateFinder) {
    templateFinder.templateFolders.unshift(path.resolve(__dirname, 'templates'));

    templateFinder.templatePatterns = templateFinder.templatePatterns.concat([
      'website/data/${ doc.id }.template.js',
      'website/${ doc.name }.template.js',
      '${ doc.area }/${ doc.docType }.template.js',
      '${ doc.area }/${ doc.name }'
    ]);
  })

  // add more tags
  .config(function(parseTagsProcessor, getInjectables) {
    getInjectables(require('./tag-defs')).forEach(function(v) {
      parseTagsProcessor.tagDefinitions.push(v);
    });
  })

  // adding more templates to computePathsProcessor configuration
  .config(function(computePathsProcessor) {
    computePathsProcessor.pathTemplates.push({
      docTypes: ['website'],
      pathTemplate: '${docType}/${name}',
      outputPathTemplate: '${id}'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['nav-data'],
      pathTemplate: 'web-data/template.js',
      outputPathTemplate: 'data/${id}.js'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['search-data'],
      pathTemplate: 'web-data/template.js',
      outputPathTemplate: 'data/${id}.js'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['search-data-index'],
      pathTemplate: 'web-data/template.js',
      outputPathTemplate: 'data/${name}'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['config-data'],
      pathTemplate: 'web-data/template.js',
      outputPathTemplate: '${name}'
    });
  })
;