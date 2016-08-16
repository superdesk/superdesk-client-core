'use strict';

var path = require('path');
var rootDir = path.dirname(path.dirname(__dirname));

var src = [
    'scripts/**/*.html',
    'scripts/**/*.svg'
];

var options = {
    htmlmin: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true
    },
    bootstrap: function(module, script) {
        return '"use strict";' +
            'angular.module("superdesk.templates-cache")' +
            '.run([\'$templateCache\', function($templateCache) {' +
            script + ' }]);';
    }
};

module.exports = {
    core: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: src,
        options: options
    },
    docs: {
        cwd: '<%= coreDir %>',
        dest: 'docs/dist/templates-cache-docs.generated.js',
        src: src,
        options: options
    },
    dev: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: [],
        options: {
            bootstrap: function() {
                return '';
            }
        }
    }
};
