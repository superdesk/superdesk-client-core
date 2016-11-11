'use strict';

module.exports = function generateConfigProcessor(log) {

  var debug = log.debug;

  var title = "";
  var version = "";
  var root = "api";

  return {
    title: function(t) {
      title = t;
      return this;
    },
    version: function(v) {
      version = v;
      return this;
    },
    rootArea: function(r) {
      root = r;
      return this;
    },
    $runBefore: ['rendering-docs'],
    $process: function (docs) {
      docs.push({
        area: 'website',
        docType: 'config-data',
        id: 'config',
        name: 'data/config.js',
        config: {
            TITLE: title,
            ROOT: root,
            VERSION: version
        }
      });
    }
  };
};
