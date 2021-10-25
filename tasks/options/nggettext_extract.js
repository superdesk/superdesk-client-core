module.exports = {
    options: {
        markerNamePlural: 'gettextPlural',
        extensions: {
            htm: 'html',
            html: 'html',
            js: 'js',
            jsx: 'js',
            tsx: 'js',
            ts: 'js',
        },
    },
    pot: {
        files: {
            '<%= poDir %>/superdesk.pot': [
                'scripts/**/*.{html,js,jsx,tsx,ts}',
                '!scripts/extensions/*/node_modules/**/*',
                '!scripts/**/*.d.ts',

                // planning
                '../superdesk-planning/index.{js,jsx,ts,tsx}',
                '../superdesk-planning/client/**/*.{html,js,jsx,tsx,ts}',
                '!../superdesk-planning/client/planning-extension/node_modules/**/*',

                // analytics
                '../superdesk-analytics/index.{js,jsx,ts,tsx}',
                '../superdesk-analytics/client/**/*.{html,js,jsx,tsx,ts}',
            ],
        },
    },
};
