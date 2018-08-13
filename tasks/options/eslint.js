var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        configFile: path.join(root, '.eslintrc.js'),
        quiet: true,
    },

    app: {
        src: [
            path.join(root, 'scripts/**/*.js'),
            path.join(root, 'scripts/**/*.tsx'),
        ],
        envs: ['browser', 'amd'],
    },

    specs: {
        src: [
            path.join(root, 'spec/**/*.js'),
            path.join(root, 'spec/**/*.tsx'),
        ],
        envs: ['node', 'jasmine'],
    },

    tasks: {
        src: path.join(root, 'tasks/**/*.js'),
        envs: ['node'],
    },

    root: {
        src: path.join(root, '*.js'),
        envs: ['node'],
    },
};
