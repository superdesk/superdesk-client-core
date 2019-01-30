module.exports = {
    options: {
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
                // planning
                '../superdesk-planning/index.js',
                '../superdesk-planning/client/**/*.{html,js,jsx,tsx,ts}',
            ],
        },
    },
};
