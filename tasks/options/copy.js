var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    index: {
        files: [{
            cwd: process.cwd(),
            src: path.join(root, 'index.html'),
            dest: '<%= distDir %>/index.html'
        }]
    },
    assets: {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>',
                dest: '<%= distDir %>',
                src: [
                    'fonts/*',
                    'images/**/*',
                    'scripts/**/*.{css,jpg,jpeg,png,gif,svg,json}'
                ]
            },
            {
                expand: true,
                dot: true,
                cwd: '<%= appDir %>',
                dest: '<%= distDir %>',
                src: [
                    'fonts/*',
                    'images/**/*',
                    'styles/css/*.css',
                    'scripts/**/*.{html,css,jpg,jpeg,png,gif,svg,json}'
                ]
            }
        ]
    },
    docs: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>/docs',
            dest: '<%= distDir %>',
            src: [
                'views/**/*.{html,css,jpg,jpeg,png,gif,svg,json}'
            ]
        },
        {
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'docs/images/**/*.{jpg,jpeg,png,gif,svg}'
            ]
        }]
    },
    js: {
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= appDir %>',
            dest: '<%= distDir %>',
            src: [
                'scripts/config.js',
                'scripts/bower_components/**/*.js'
            ]
        }]
    }
};
