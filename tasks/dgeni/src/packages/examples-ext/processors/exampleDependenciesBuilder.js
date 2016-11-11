'use strict';

var _ = require('lodash');
var path = require('path');
var fs = require('fs');

/**
 * Processor builds list of the project artifact dependencies to copy to the docs.
 *
 * Each deployment (defined for {@link generateExamplesProcessor generateExamplesProcessor}) will have the own set of artifacts
 * to make build docs available for the standalone usage.
 *
 * @name exampleDependenciesBuilder
 */
module.exports = function exampleDependenciesBuilder (readFilesProcessor, log, generateExamplesProcessor, exampleMap) {
  /**
   * Regular expression to check if path is external
   * @type {RegExp}
   */
  var REMOTE_REG = /(https?:)?\/\//i;

  /**
   * Document type for docs entries
   * @type {String}
   */
  var DOC_TYPE = 'example-dependency';

  return {
    $runAfter: ['adding-extra-docs'],
    $runBefore: ['generateExamplesProcessor'],
    $process: function (docs) {
      /**
       * Deployments file storage, each de
       */
      var deployments = [];

      // traverse deployments, check project dependencies and add local file
      // dependencies to the list of generated documents
      generateExamplesProcessor.deployments.forEach(function(deployment) {

        var name = makeUniqueName(deployments, deployment.name);
        var processor = processDependency.bind(null, docs, name);

        var commonFiles = deployment.examples && deployment.examples.commonFiles || {};
        (commonFiles.scripts || []).forEach(processor);
        (commonFiles.stylesheets || []).forEach(processor);
      })
    }
  };

  /**
   * Processes single dependency and creates new document if needed
   * @param {Array} docs array of generated documents
   * @param {String} name unique deployment name
   * @param {String} item deployment item, usually local or remote artifact (script, stylesheet, etc.)
   * @param {Number} index item index in arr
   * @param {Array} arr array of deployment dependencies
   */
  function processDependency (docs, name, item, index, arr) {
    if (!REMOTE_REG.test(item)) {
      // local file, add to copy items
      var fileDoc = makeFileDoc(name, item);

      arr[index] = fileDoc.path;
      docs.push(fileDoc);
    }
  }

  /**
   * Creates document entry for a given file
   * @param {String} name unique deployment name
   * @param {String} script example dependency
   * @returns {Object} document entry
   */
  function makeFileDoc (name, script) {
    return {
      docType: DOC_TYPE,
      id: name + '/' + script,
      fileContents: fs.readFileSync(path.join(readFilesProcessor.basePath, script)),
      template: 'template' + path.extname(script),
      // make path relative to example output template examples/${example.id}/index,
      path: path.join('../../examples-dep', name, script),
      outputPath: path.join('examples-dep', name, script),
    };
  }

  /**
   * Creates unique folder name for the current deployment
   */
  function makeUniqueName (deployments, name) {
    if (!name) {
      name = 'deployment';
    }
    var i = 0;
    while (deployments.indexOf((name + (i ? i : ''))) > -1) {
      i++;
    }
    if (i) {
      name = name + i;
    }
    deployments.push(name);
    return name;
  }
};
