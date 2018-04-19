module.exports = function(grunt) {
    return {
        options: {
            packages: [
                'dgeni-packages/base',
                'dgeni-packages/jsdoc',
                'dgeni-packages/ngdoc',
            ],

            serve: grunt.option('no-serve') ? null : {
                port: 10000,
                openBrowser: true, // or command to run favorite browser
            },
        },

        api: {
            title: '<%= pkg.name %>',
            version: '<%= pkg.version %>',
            expand: false,
            dest: 'dist/docs',

            src: [
                'scripts/**/*.js',
                'scripts/**/*.ngdoc',
                '!**/test/**/*spec.js',
            ],

            templatePaths: ['docs/templates'],
        },
    };
};
