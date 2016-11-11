
var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {configFile: path.join(root, '.eslintrc')},
    app: {
        src: [
            '<%= appDir %>/*.js',
            path.join(root, 'scripts/**/*.js')
        ],
        envs: ['browser', 'amd']
    },
    specs: {
        src: [
            path.join(root, 'spec/**/*.js'),
            path.join(root, 'scripts/**/*[Ss]pec.js')
        ],
        envs: ['node', 'jasmine']
    },
    tasks: {
        src: [
            path.join(root, 'tasks/**/*.js'),
            '!' + path.join(root, 'tasks/dgeni/**/*.js')
        ],
        envs: ['node']
    },
    root: {
        src: path.join(root, '*.js'),
        envs: ['node']
    }
};
