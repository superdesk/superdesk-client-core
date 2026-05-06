var path = require('path');
var execSync = require('child_process').execSync;

module.exports = function(grunt) {
    var config = {
        pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
        appDir: 'app',
        tmpDir: '.tmp',
        distDir: 'dist',
        specDir: 'spec',
        tasksDir: 'tasks',
        bowerDir: 'bower',
        comDir: 'bower_components',
        coreDir: __dirname,
        poDir: 'po',
        livereloadPort: 35729,
    };

    grunt.initConfig(config);

    // Auto-load tasks
    require('load-grunt-tasks')(grunt, {
        config: path.join(__dirname, 'package'),
        pattern: [
            'grunt-*',
            '@*/grunt-*',
        ],
    });

    // Auto-load configuration
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options'),
    });

    // Test runner tasks and CI
    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('ci', ['test']);
    grunt.registerTask('unit', ['test']);
    grunt.registerTask('ci:travis', ['ngtemplates:gen-apps', 'ngtemplates:dev', 'karma:travis']);
    grunt.registerTask('bamboo', ['karma:bamboo']);

    // UI styling documentation
    grunt.registerTask('ui-guide', [
        'clean',
        'ngtemplates:dev',
        'ngtemplates:ui-guide',
        'copy:assets-ui-guide',
        'webpack-dev-server:ui-guide',
    ]);

    // Compile PO files to runtime JSON catalogs (gettext.js flat format with metadata under "" key).
    // Used by scripts/init.ts and scripts/reload-language.ts. Production build runs this via
    // build-tools' build-root-repo command; this grunt task lets `grunt server` produce them too.
    grunt.registerTask('po-to-json', 'Compile po/*.po to dist/languages/*.json', function() {
        var poDir = path.join(__dirname, 'po');
        var jsonDir = path.join(process.cwd(), config.distDir, 'languages');
        var compileTranslationsPoToJson = require('@superdesk/build-tools/src/po-to-json');

        compileTranslationsPoToJson(poDir, jsonDir);
    });

    // Development server
    grunt.registerTask('server', [
        'clean',
        'ngtemplates:index',
        'copy:index',
        'copy:config',
        'copy:locales',
        'po-to-json',
        'ngtemplates:gen-apps',
        'ngtemplates:dev',
        'webpack-dev-server:start',
    ]);

    // gettext
    grunt.registerTask('gettext:extract', ['nggettext_extract']);

    // Production build
    grunt.registerTask('build', '', () => {
        grunt.task.run([
            'clean',
            'ngtemplates:index',
            'copy:index',
            'copy:config',
            'copy:assets',
            'copy:locales',
            'ngtemplates:gen-apps',
            'ngtemplates:core',
        ]);

        // if we have "*.po" files in "superdesk/client"
        // use them to generate "lang.generated.js"
        // to support client based translations
        var pkgName = grunt.file.readJSON('package.json').name;

        if (grunt.file.expand('po/*.po').length && pkgName != 'superdesk-core') {
            grunt.task.run([
                'nggettext_extract',
            ]);
        }

        grunt.task.run([
            'nggettext_compile',
            'webpack:build',
            'filerev',
            'usemin',
        ]);
    });

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
