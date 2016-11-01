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

    // gen-locale generates a file that imports the locale set by the
    // 'i18n' property in the config file.
    'gen-locale': {
        cwd: '<%= coreDir %>',
        dest: 'dist/locale.generated.js',
        src: __filename, // hack to make ngtemplate work
        options: {
            bootstrap: function() {
                var locale = getConfig().i18n || '';
                if (locale === '') {
                    return 'export default [];\r\n';
                }
                var f = path.join(
                    'angular-i18n',
                    'angular-locale_' + locale + '.js'
                );
                return `require('${f}');\r\n`;
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
