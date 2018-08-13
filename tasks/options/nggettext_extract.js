module.exports = {
    options: {
        extensions: {
            htm: 'html',
            html: 'html',
            js: 'js',
            tsx: 'js',
        },
    },
    pot: {
        files: {
            '<%= poDir %>/superdesk.pot': [
                'scripts/**/*.{html,js,tsx}',
                // planning
                '../superdesk-planning/index.js',
                '../superdesk-planning/client/**/*.{html,js,tsx}',
            ],
        },
    },
};
