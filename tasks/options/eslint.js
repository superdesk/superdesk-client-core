
var path = require('path');
var root = path.dirname(path.dirname(__dirname));

module.exports = {
    options: {
        configFile: path.join(root, '.eslintrc.json')
    },
    app: {
        src: [
            path.join(root, 'scripts/**/*.js'),
            '!' + path.join(root, 'scripts/**/*.generated.js'),
            '!' + path.join(root, 'scripts/core/lang/missing-translations-strings.js'),
            '!' + path.join(root, 'scripts/core/lang/language-mapping-list.js'),
            path.join(root, 'scripts/**/*.jsx')
        ],
        envs: ['browser', 'amd']
    },
    specs: {
        src: [
            path.join(root, 'spec/**/*.js'),
            path.join(root, 'spec/**/*.jsx'),
            path.join(root, 'scripts/**/*[Ss]pec.js'),
            path.join(root, 'scripts/**/*[Ss]pec.jsx')
        ],
        envs: ['node', 'jasmine']
    },
    tasks: {
        src: path.join(root, 'tasks/**/*.js'),
        envs: ['node']
    },
    root: {
        src: path.join(root, '*.js'),
        envs: ['node']
    }
};
