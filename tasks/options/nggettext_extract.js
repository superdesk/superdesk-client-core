module.exports = {
    options: {
        extensions: {
            htm: 'html',
            html: 'html',
            js: 'js',
            jsx: 'js',
        },
    },
    pot: {
        files: {
            '<%= poDir %>/superdesk.pot': [
                'scripts/**/*.{html,js,jsx}',
                // planning
                '../superdesk-planning/index.js',
                '../superdesk-planning/client/**/*.{html,js,jsx}',
            ],
        }
    },
};
