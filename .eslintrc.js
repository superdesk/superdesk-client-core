const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {
    parser: 'typescript-eslint-parser',
    overrides: {
        files: ['*.ts', '*.tsx'],
        rules: {
            'no-undef': 0
        },
    },
});