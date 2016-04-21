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

    grunt.registerTask('style', ['less:dev', 'cssmin']);

    grunt.registerTask('test', ['karma:unit']);
    grunt.registerTask('hint', ['jshint', 'jscs', 'eslint:specs', 'eslint:tasks', 'eslint:root']);
    grunt.registerTask('hint:docs', ['jshint:docs', 'jscs:docs']);
    grunt.registerTask('ci', ['test', 'hint']);
    grunt.registerTask('ci:travis', ['karma:travis', 'hint']);
    grunt.registerTask('bamboo', ['karma:bamboo']);
    grunt.registerTask('lint', ['hint']);

    grunt.registerTask('docs', [
        'clean',
        'less:docs',
        'cssmin',
        'template:docs',
        'connect:test',
        'open:docs',
        'ngtemplates',
        'watch'
    ]);

    grunt.registerTask('server', [
        'clean',
        'style',
        'template:test',
        'connect:test',
        'watch'
    ]);

    grunt.registerTask('server:e2e', [
        'clean',
        'style',
        'template:mock',
        'connect:mock',
        'ngtemplates',
        'watch'
    ]);

    grunt.registerTask('server:travis', [
        'clean',
        'style',
        'ngtemplates',
        'template:travis',
        'connect:travis'
    ]);

    grunt.registerTask('bower', [
        'build',
        'copy:bower',
        'concat:bowerCore',
        'uglify:bower',
        'clean:bower'
    ]);

    grunt.registerTask('build', [
        'clean',
        'less:dev',
        'ngtemplates',
        'useminPrepare',
        'concat:generated',
        'uglify:generated',
        'cssmin:generated',
        'copy:assets',
        'copy:js',
        'copy:docs',
        'template:test',
        'template:docs',
        'filerev',
        'usemin'
    ]);

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
