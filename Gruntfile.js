'use strict';

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
        livereloadPort: 35729
    };

    grunt.initConfig(config);

    // Auto-load tasks
    require('load-grunt-tasks')(grunt, {
        config: path.join(__dirname, 'package'),
        pattern: [
            'grunt-*',
            '@*/grunt-*',
            'dgeni-alive'
        ]
    });

    // Auto-load configuration
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options')
    });

    // Linting tasks and alias
    grunt.registerTask('hint', ['jshint', 'jscs', 'eslint:specs', 'eslint:tasks', 'eslint:root']);
    grunt.registerTask('lint', ['hint']);

    // Test runner tasks and CI
    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('ci', ['test', 'hint']);
    grunt.registerTask('ci:travis', ['ngtemplates:dev', 'karma:travis', 'hint']);
    grunt.registerTask('bamboo', ['karma:bamboo']);

    // The gen-importer tasks generates files that import dynamic paths read from
    // superdesk.config.js
    grunt.registerTask('ngtemplates:gen-importer', [
        'ngtemplates:gen-apps',
        'ngtemplates:gen-locale'
    ]);

    // UI styling documentation
    grunt.registerTask('ui-guide', [
        'clean',
        'ngtemplates:dev',
        'ngtemplates:ui-guide',
        'copy:assets-ui-guide',
        'webpack-dev-server:ui-guide'
    ]);

    // API docuemntation
    grunt.registerTask('docs', ['dgeni-alive']);

    // Development server
    grunt.registerTask('server', [
        'clean',
        'copy:index',
        'ngtemplates:gen-importer',
        'ngtemplates:dev',
        'webpack-dev-server:start'
    ]);

    // Production build
    grunt.registerTask('build', [
        'clean',
        'copy:index',
        'copy:assets',
        'ngtemplates:gen-importer',
        'ngtemplates:core',
        'webpack:build'
    ]);

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
