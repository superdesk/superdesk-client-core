const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {
    rules: Object.assign(sharedConfigs.rules, {
        'no-nested-ternary': 0,
        'no-unused-vars': 0, // marks typescript interfaces as unused vars
        'no-undef': 0, // marks interface properties as usages of undeclared variables

        // field names from back-end use snake_case for naming.
        // I'm not convinced it's worth using a bracket notation only to satisfy a lint rule
        'camelcase': 0,

        // doesn't make sense with many properties
        // 10 may use shorthand and one may be inline or reference differently named variable
        'object-shorthand': 0,

        // can make functions harder to read; forces into rewriting the function to insert a debugger
        'arrow-body-style': 0,

        // leaving up to developers. I prefer to quote external strings like css names,
        // but keep internal properties unquoted unless required
        'quote-props': 0,

        'no-sequences': 2,

        'newline-per-chained-call': ['error', {'ignoreChainWithDepth': 3}],

        '@typescript-eslint/array-type': [
            'error',
            {
              'default': 'generic'
            }
        ],

        // requires at least ESLint v7.1.0
        '@typescript-eslint/no-loss-of-precision': 'off',

        // needs work to convert
        '@typescript-eslint/no-var-requires': 'off',

        // TODO: re-enable the following rules
        // '@typescript-eslint/no-non-null-assertion': 'error',
        'prefer-const': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-this-alias': 'off',
    }),
    plugins: [...(sharedConfigs.plugins ?? []), '@typescript-eslint'],

    extends: [...(sharedConfigs.extends ?? []), 'plugin:@typescript-eslint/recommended'],

    parser: '@typescript-eslint/parser',

    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'react/prop-types': 0, // interfaces are used in TypeScript files
                'no-unused-vars': 0,
                'no-undef': 0,
                'camelcase': 0,
                'object-shorthand': 0,
                'arrow-body-style': 0,
                'newline-per-chained-call': 0,
                'quote-props': 0,
                'arrow-body-style': 0,

                "comma-dangle": ["error", {
                    "arrays": "always-multiline",
                    "objects": "always-multiline",
                    "imports": "always-multiline",
                    "exports": "always-multiline",
                    "functions": "always-multiline"
                }],


                // allow calling hasOwnProperty
                "no-prototype-builtins": 0,
            },
        },
    ],
});