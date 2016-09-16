'use strict';

var path = require('path');

module.exports = function(grunt) {

    // util for grunt.template
    grunt.toJSON = function(input) {
        return JSON.stringify(input);
    };

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

    require('load-grunt-tasks')(grunt, {config: path.join(__dirname, 'package')});
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options')
    });

    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('hint', ['jshint', 'jscs', 'eslint:specs', 'eslint:tasks', 'eslint:root']);
    grunt.registerTask('hint:docs', ['jshint:docs', 'jscs:docs']);
    grunt.registerTask('ci', ['test', 'hint']);
    grunt.registerTask('ci:travis', ['ngtemplates:dev', 'karma:travis', 'hint']);
    grunt.registerTask('bamboo', ['karma:bamboo']);
    grunt.registerTask('lint', ['hint']);

    grunt.registerTask('docs', [
        'clean',
        'ngtemplates:dev',
        'ngtemplates:docs',
        'copy:assets-docs',
        'webpack-dev-server:docs'
    ]);

    grunt.registerTask('server', [
        'clean',
        'copy:index',
        'ngtemplates:gen-importer',
        'ngtemplates:dev',
        'webpack-dev-server:start'
    ]);

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
