'use strict';

/**
 * Generates web app by given templates
 *
 * @dgService generateWebsiteProcessor
 */
module.exports = function generateWebsiteProcessor (log) {

  var debug = log.debug;

  var templates = [
      'index.html',
      'views/content.html',
      'views/footer.html',
      'views/main.html',
      'views/navbar.html',
      'views/sidebar.html',
      'views/searchbox.html',
      'scripts/a.directive.js',
      'scripts/docs.controller.js',
      'scripts/index.js',
      'scripts/main.controller.js',
      'scripts/navbar.controller.js',
      'scripts/search.controller.js',
      'scripts/pre.directive.js',
      'scripts/bloomfilter.js',
      'styles/docs.css',
      'styles/github.css',
      'styles/runnableExample.css',
      'bower.json',
      '.bowerrc'
  ];
  var locals = {};

  /**
   * An array of objects
   * @type {Array}
   *
   * {
   *    template: 'views/main.html',
   *    file: 'main.html'
   * }
   *
   * Be sure to add the template folder that your new main.html is in so it can find it.
   */
  var templateOverrides = [];

  return {
    locals: function(n, v) {
      if (void(v) === v) {
        delete locals[n];
      } else {
        locals[n] = v;
      }
      return this;
    },
    templates: templates,
    $runBefore: ['rendering-docs'],
    $process: function generateWebsiteProcessor (docs) {
      this.templates.forEach(function(t) {
        docs.push({
          docType: 'website',
          area: 'website',
          id: t,
          name: t.replace(/(^|\/)(\.)/g, '$1dot$2'),
          locals: locals
        });
      });
    }
  };
};
