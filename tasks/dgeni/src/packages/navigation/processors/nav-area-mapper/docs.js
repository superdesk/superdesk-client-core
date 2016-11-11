'use strict';

var _ = require('lodash');

module.exports = function navigationMapper_DOCS(aliasMap, log) {

  var debug = log.debug;

  function docsMapper (pages, key) {
    var res = {
      name: 'Docs',
      type: 'groups',
      href: key,
      navItems: []
    };

    _(pages)
      .sortBy(docsMapper.sortBy)
      .forEach(function (page) {
        res.navItems.push({
          name: page.name,
          type: '',
          href: page.path,
         title: page.title
        });
    });

    return [res];
  };


  Object.defineProperty(docsMapper, 'area', {
    value: 'guide'
  });

  Object.defineProperty(docsMapper, 'title', {
    value: 'Guide'
  });

  Object.defineProperty(docsMapper, 'sortBy', {
    value: [
      'sortOrder',
      'name'
    ]});

  return docsMapper;
};
