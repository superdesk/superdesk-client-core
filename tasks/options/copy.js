var path = require('path');
var appRoot = path.dirname(path.dirname(__dirname));

module.exports = {
    index: {
        files: [
            {
                cwd: process.cwd(),
                src: './index.html',
                dest: '<%= distDir %>/index.html'
            }
        ]
    },
    config: {
        files: [
            {
                cwd: process.cwd(),
                src: path.join(appRoot, 'scripts', 'config.js'),
                dest: '<%= distDir %>/config.js'
            },
            {
                cwd: process.cwd(),
                src: 'config.js',
                dest: '<%= distDir %>/config.js'
            },
        ]
    },
    assets: {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>',
                dest: '<%= distDir %>',
                src: ['images/**/*', 'scripts/**/*.{json,svg}']
            }
        ]
    },
    locales: {
        files: [
            {
                expand: true,
                cwd: process.cwd(),
                src: ['node_modules/angular-i18n/angular-locale_*.js'],
                dest: '<%= distDir %>/locales/',
                flatten: true,
                filter: 'isFile'
            }
        ]
    },
    'assets-ui-guide': {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>',
                dest: 'docs/ui-guide/dist',
                src: ['images/**/*']
            },
            {
                cwd: process.cwd(),
                src: path.join(appRoot, 'docs/ui-guide/index.html'),
                dest: path.join(appRoot, 'docs/ui-guide/dist/index.html')
            }
        ]
    }
};
