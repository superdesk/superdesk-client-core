'use strict';

var _ = require('lodash');

module.exports = function navigationMapper_GUIDE(aliasMap, log) {

  var debug = log.debug;

  function guideMapper (pages, key) {
    var res = {
      name: 'Guide',
      type: 'groups',
      href: key,
      navItems: []
    };

    _(pages)
      .sortBy(guideMapper.sortBy)
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


  Object.defineProperty(guideMapper, 'area', {
    value: 'guide'
  });

  Object.defineProperty(guideMapper, 'title', {
    value: 'Guide'
  });

  Object.defineProperty(guideMapper, 'sortBy', {
    value: [
      'sortOrder',
      'name'
    ]});

  return guideMapper;
};
