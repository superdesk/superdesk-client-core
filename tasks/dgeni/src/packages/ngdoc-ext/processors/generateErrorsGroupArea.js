var _ = require('lodash');

/**
 * @dgProcessor generateErrorsGroupArea
 * @description
 * Provides representation for the error and updates error data to match newly created module
 * If matching module is found, no new module is created
 */
module.exports = function generateErrorsGroupArea(log, aliasMap, moduleMap, createDocMessage) {
  return {
    $runAfter: ['moduleDocsProcessor'],
    $runBefore: ['generateComponentGroupsProcessor'],
    $process: function(docs) {
      // walk through the modules, take all error references and provide errors area
      moduleMap.forEach(function(module) {
        var group = _(module.components)
          .groupBy('docType')
          .thru(function(groups) {
            if (groups.error) {
              module.components = module.components.filter(function(component) {
                // remove error entries from module
                // errors should not be shown in the main tree
                return 'error' !== component.docType;
              });

              // create error entry
              return {
                id: module.id + '.error',
                docType: 'module',
                groupType: 'error',
                moduleName: module.name,
                module: module.name,
                moduleDoc: {},
                area: 'error',
                name: module.name,
                components: groups.error
              };
            }
          }).value();

        if (group) {
          docs.push(group);
        }
      });
    }
  };
};
