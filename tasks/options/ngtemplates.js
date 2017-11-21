

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

// get the superdesk.config.js configuration object
function getConfig() {
    return require(path.join(process.cwd(), 'superdesk.config.js'))();
}

module.exports = {
    core: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: src,
        options: options
    },

    'ui-guide': {
        cwd: '<%= coreDir %>',
        dest: 'docs/ui-guide/dist/templates-cache-docs.generated.js',
        src: src,
        options: options
    },

    dev: {
        cwd: '<%= coreDir %>',
        dest: path.join(rootDir, 'templates-cache.generated.js'),
        src: [],
        options: {bootstrap: () => ''}
    },

    index: {
        cwd: '<%= coreDir %>',
        dest: './index.html',
        src: __filename, // hack to make ngtemplate work
        options: {
            bootstrap: () => {
                const features = getConfig().features || {};
                const buildIndex = require('../../index.html.js');

                return buildIndex(features);
            }
        }
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
                // get apps defined in config
                var paths = getConfig().apps || [];

                if (!paths.length) {
                    return 'export default [];\r\n';
                }

                // abs returns the correct absolute path to be used with a require call. On Windows,
                // it correctly converts backslash (\) characters to forward-slash (/).
                let abs = (p) => {
                    let abspath = path.join(process.cwd(), 'node_modules', p);

                    if (/^win/.test(process.platform)) {
                        return abspath.replace(/\\/g, '/');
                    }
                    return abspath;
                };

                let data = 'export default [\r\n\trequire("' + abs(paths[0]) + '").default.name';

                for (var i = 1; i < paths.length; i++) {
                    data += ',\r\n\trequire("' + abs(paths[i]) + '").default.name';
                }

                return data + '\r\n];\r\n';
            }
        }
    }
};
