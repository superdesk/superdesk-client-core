'use strict';

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
        dest: '<%= distDir %>/templates-cache.js',
        src: src,
        options: options
    },
    dev: {
        cwd: '<%= coreDir %>',
        dest: '<%= distDir %>/templates-cache.js',
        src: [],
        options: {
            bootstrap: function() {
                return '';
            }
        }
    }
};
