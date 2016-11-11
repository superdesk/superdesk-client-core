'use strict';

var _ = require('lodash');

module.exports = function generateNavigationProcessor(aliasMap, log) {

  var debug = log.debug;

  var AREAS = {
  };

  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    /**
     * Appends or replaces mappers
     */
    addMappers: function (mappers) {
      mappers.forEach(function(mapper) {
        AREAS[mapper.area] = mapper;
      })
    },
    $process: function (docs) {

      var areas = {}, areaIds = [];
      _(docs)
      .filter(function (it) {
        return it.area;
      }).groupBy('area').forEach(function (pages, key) {
        debug('Start process area:', key);

        // take area aliases and link doc to first one
        var doc = aliasMap.getDocs(key + ':index');
        if (doc.length > 0) {
            doc = doc[0];
        } else {
            log.warn('No index document found for "%s"\nCreate %s/index.ngdoc file in the documents area with template' +
                     '\n===================\n@ngdoc overview\n@name index\n@area %s\n@description Module Overview', key, key, key);
            doc = { path: key };
        }

        if (AREAS[key]) {
          areas[key] = {
            id: key,
            href: doc.path,
            name: AREAS[key].title || key,
            fullscreen: doc.fullscreen,
            navGroups: AREAS[key](pages, key)
          };
          doc.areaKey = key;
          areaIds.push(key);
        }
      });

      docs.push({
        area: 'nav-data',
        docType: 'nav-data',
        id: 'nav-data',
        areas: areas
      });

      docs.push({
        area: 'nav-data',
        docType: 'nav-data',
        id: 'area-data',
        areaIds: areaIds
      });
    }
  };
};
