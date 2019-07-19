const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {
    parser: 'typescript-eslint-parser',
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'react/prop-types': 0, // interfaces are used in TypeScript files
                'no-unused-vars': 0,
                'no-undef': 0,
                'comma-dangle': 0,
                'camelcase': 0,
                'object-shorthand': 0,
                'arrow-body-style': 0,
                'newline-per-chained-call': 0,
                'quote-props': 0,
                'arrow-body-style': 0,
                'max-len': 0, // handled by tslint
            },
        },
    ],
});