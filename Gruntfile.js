var path = require('path');

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

    // Linting tasks and alias
    grunt.registerTask('hint', ['eslint']);

    // Test runner tasks and CI
    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('ci', ['test', 'hint']);
    grunt.registerTask('unit', ['test']);
    grunt.registerTask('ci:travis', ['ngtemplates:dev', 'karma:travis', 'hint']);
    grunt.registerTask('bamboo', ['karma:bamboo']);

    // UI styling documentation
    grunt.registerTask('ui-guide', [
        'clean',
        'ngtemplates:dev',
        'ngtemplates:ui-guide',
        'copy:assets-ui-guide',
        'webpack-dev-server:ui-guide',
    ]);

    // Development server
    grunt.registerTask('server', [
        'clean',
        'ngtemplates:index',
        'copy:index',
        'copy:config',
        'copy:locales',
        'ngtemplates:gen-apps',
        'ngtemplates:dev',
        'webpack-dev-server:start',
    ]);

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
                'nggettext_compile',
            ]);
        }

        grunt.task.run([
            'webpack:build',
            'filerev',
            'usemin',
        ]);
    });

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
