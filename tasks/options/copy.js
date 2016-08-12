var path = require('path');
var appRoot = path.dirname(path.dirname(__dirname));

module.exports = {
    index: {
        files: [
            {
                cwd: process.cwd(),
                src: path.join(appRoot, 'index.html'),
                dest: '<%= distDir %>/index.html'
            },
            {
                cwd: process.cwd(),
                src: path.join(appRoot, 'index.html'),
                dest: './index.html'
            }
        ]
    },
    assets: {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>',
                dest: '<%= distDir %>',
                src: ['images/**/*', 'scripts/**/*.json']
            }
        ]
    },
    'assets-docs': {
        files: [
            {
                expand: true,
                dot: true,
                cwd: '<%= coreDir %>',
                dest: 'docs/dist',
                src: ['images/**/*']
            },
            {
                cwd: process.cwd(),
                src: path.join(appRoot, 'docs/index.html'),
                dest: path.join(appRoot, 'docs/dist/index.html')
            }
        ]
    }
};
