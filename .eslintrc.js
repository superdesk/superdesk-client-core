const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {
    parser: 'typescript-eslint-parser',
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'no-unused-vars': 0,
                'no-undef': 0,
                'comma-dangle': 0,
            },
        },
        {
            files: ['scripts/superdesk-interfaces/*'],
            rules: {
                'camelcase': 0,
            },
        }
    ],
});