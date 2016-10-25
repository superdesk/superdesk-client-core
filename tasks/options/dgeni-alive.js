module.exports = {
    options: {
        packages: [
            'dgeni-packages/base',
            'dgeni-packages/jsdoc',
            'dgeni-packages/ngdoc'
        ],

        serve: {
            port: 10000,
            openBrowser: true // or command to run favorite browser
        }
    },
    api: {
        title: '<%= pkg.name %>',
        version: '<%= pkg.version %>',
        expand: false,
        dest: 'dist/docs',

        src: [
            'scripts/**/*.js',
            'docs/ngdoc/**/*.ngdoc',
            '!**/test/**/*spec.js'
        ]
    }
};
