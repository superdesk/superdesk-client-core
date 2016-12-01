var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        configFile: path.join(root, '.eslintrc.json'),
        quiet: true
    },

    app: {
        src: [
            path.join(root, 'scripts/**/*.js'),
            path.join(root, 'scripts/**/*.jsx')
        ],
        envs: ['browser', 'amd']
    },

    specs: {
        src: [
            path.join(root, 'spec/**/*.js'),
            path.join(root, 'spec/**/*.jsx')
        ],
        envs: ['node', 'jasmine']
    },

    tasks: {
        src: path.join(root, 'tasks/**/*.js'),
        envs: ['node']
    }
};
