'use strict';

var path = require('path');
var core = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        livereload: '<%= livereloadPort %>'
    },
    less: {
        tasks: ['style'],
        files: [
            path.join(core, 'styles/{,*/}*.less'),
            path.join(core, 'scripts/**/*.less'),
            '<%= appDir %>/**/*.less'
        ]
    },
    code: {
        options: {livereload: true},
        tasks: ['webpack:build-dev'],
        files: [
            path.join(core, 'scripts/**/*.js'),
            '<%= appDir %>/**/*.js',
            '!' + path.join(core, 'scripts/**/*[sS]pec.js')
        ]
    },
    ngtemplates: {
        options: {livereload: true},
        tasks: [],
        files: [
            path.join(core, 'scripts/**/*.html'),
            '<%= appDir %>/templates/**/*.html'
        ]
    },
    assets: {
        options: {livereload: true},
        tasks: [],
        files: [
            '<%= distDir %>/*.css',
            '<%= appDir %>/docs/**/*.html'
        ]
    },
    index: {
        options: {livereload: true},
        tasks: ['template'],
        files: ['<%= appDir %>/index.html']
    },
    less_docs: {
        options: {livereload: true},
        tasks: ['less:docs', 'cssmin'],
        files: [
            '<%= appDir %>/docs/**/*.less'
        ]
    },
    code_docs: {
        options: {livereload: true},
        tasks: ['hint:docs'],
        files: ['<%= appDir %>/docs/**/*.js']
    },
    html_docs: {
        options: {livereload: true},
        tasks: ['template:docs'],
        files: ['<%= appDir %>/docs.html']
    }
};
