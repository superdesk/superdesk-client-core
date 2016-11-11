var Package = require('dgeni').Package;

module.exports = function mockPackage() {

  return new Package('mockPackage', [require('../')])

  // provide a mock log service
  .factory('log', function() { return require('dgeni/lib/mocks/log')(false); })

  // provide a mock template engine for the tests
  .factory('templateEngine', function dummyTemplateEngine() {})

  // provide a mock template finder for the tests
  .factory('templateFinder', function dummyTemplateFinder() {
    return {
      templateFolders: [],
      templatePatterns: []
    }
  })

  // provide a mock path compiting processor for the tests
  .factory('computePathsProcessor', function dummyComputePathsProcessor() {
    return {
      pathTemplates: []
    }
  })

  // provide mock markdown renderer for the tests
  .factory('renderMarkdown', function dummyRenderMarkdown() {
  })


  // provide a mock tags processor for the tests
  .factory('parseTagsProcessor', function dummyParseTagsProcessor() {
    return  {
      tagDefinitions: []
    }
  })

  // provide a mock navigation processor for the tests
  .factory('aliasMap', function dummyAliasMap() {
    return {
    }
  })
};
