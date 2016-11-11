'use strict';

var _ = require('lodash');

module.exports = function navigationMapper_ERROR(aliasMap, log) {

  var debug = log.debug;

  function errorMapper (pages, key) {
    var res = {
      name: 'Errors',
      title: 'Error Reference',
      type: 'groups',
      href: key,
      navItems: []
    };
    _(pages)
      .filter('module')  // take only the modules on the top level
      .sortBy('module')  // alphabetic sort
      .groupBy('module') // group by name
      .forEach(function (components, moduleName) {
        debug('Processing module: %s', moduleName);
        var mod = _.find(components, {name: moduleName, module: moduleName});

        var navGroup = {
          name: moduleName,
          type: 'section',
          href: mod.path, // 'api/' + moduleName, // conforms path calculation in docgen.js
          navItems: []
        };
        res.navItems.push(navGroup);

        _(components)
        .filter(function (it) {
          return it.docType !== 'module' && it.docType != 'overview';
        })
        .sortBy('name')
        .forEach(function (error) {
          navGroup.navItems.push({
            name: error.name,
            type: error.docType,
            href: error.path,
          });
        });
      });

    return [res];
  };

  Object.defineProperty(errorMapper, 'area', {
    value: 'error'
  });

  Object.defineProperty(errorMapper, 'title', {
    value: 'Errors'
  });

  return errorMapper;
};
