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
        options: {bootstrap: () => ''}
    },

    // gen-importer generates a file that imports all of the external node
    // modules defined in superdesk.config.js and returns an array of their
    // exports.
    'gen-importer': {
        cwd: '<%= coreDir %>',
        dest: 'dist/app-importer.generated.js',
        src: __filename, // hack to make ngtemplate work
        options: {
            bootstrap: function() {
                // get apps defined in config
                var paths = require(
                    path.join(process.cwd(), 'superdesk.config.js')
                )().apps || [];

                if (!paths.length) {
                    return 'export default [];\r\n';
                }

                let abs = p => path.join(process.cwd(), 'node_modules', p);
                let data = 'export default [\r\n\trequire("' + abs(paths[0]) + '").default.name';

                for (var i = 1; i < paths.length; i++) {
                    data += ',\r\n\trequire("' + abs(paths[i]) + '").default.name';
                }

                return data + '\r\n];\r\n';
            }
        }
    }
};
