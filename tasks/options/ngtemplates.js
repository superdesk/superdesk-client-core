var path = require('path');
var rootDir = path.dirname(path.dirname(__dirname));

var src = [
    'scripts/**/*.html',
    'scripts/**/*.svg',
];

var options = {
    htmlmin: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
    },
    bootstrap: function(module, script) {
        return '"use strict";' +
            'angular.module("superdesk.templates-cache")' +
            '.run([\'$templateCache\', function($templateCache) {' +
            script + ' }]);';
    },
};

// get the superdesk.config.js configuration object
function getConfig() {
    return require(path.join(process.cwd(), 'superdesk.config.js'))();
}

module.exports = {
    core: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: src,
        options: options,
    },

    'ui-guide': {
        cwd: '<%= coreDir %>',
        dest: 'docs/ui-guide/dist/templates-cache-docs.generated.js',
        src: src,
        options: options,
    },

    dev: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: [],
        options: {bootstrap: () => ''},
    },

    index: {
        cwd: '<%= coreDir %>',
        dest: './index.html',
        src: __filename, // hack to make ngtemplate work
        options: {
            bootstrap: () => {
                const scriptTags = getConfig().scriptTags || [];
                const buildIndex = require('../../index.html.js');

                return buildIndex({scriptTags});
            },
        },
    },

    // gen-apps generates a file that imports all of the external node
    // modules defined in superdesk.config.js and returns an array of their
    // exports.
    'gen-apps': {
        cwd: '<%= coreDir %>',
        dest: 'dist/app-importer.generated.js',
        src: __filename, // hack to make ngtemplate work
        options: {
            bootstrap: function() {
                const config = getConfig();
                const paths = config.importApps || config.apps || [];

                if (!paths.length) {
                    return 'export default [];\r\n';
                }

                let data = 'export default [\r\n\trequire("' + paths[0] + '").default.name';

                for (var i = 1; i < paths.length; i++) {
                    data += ',\r\n\trequire("' + paths[i] + '").default.name';
                }

                return data + '\r\n];\r\n';
            },
        },
    },
};
