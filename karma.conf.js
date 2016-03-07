'use strict';

var path = require('path');

module.exports = function(config) {
    config.set({
        frameworks: [
            'jasmine'
        ],

        preprocessors: {
            '**/*.html': ['ng-html2js']
        },

        // list of files / patterns to load in the browser
        files: [
            'bower_components/bind-polyfill/index.js',
            'bower_components/jquery/dist/jquery.js',
            'bower_components/lodash/lodash.js',
            'bower_components/bootstrap/dist/js/bootstrap.min.js',
            'bower_components/angular/angular.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-resource/angular-resource.js',
            'bower_components/angular-gettext/dist/angular-gettext.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'bower_components/ng-file-upload/ng-file-upload.js',

            'bower_components/gridster/dist/jquery.gridster.with-extras.js',
            'bower_components/medium-editor/dist/js/medium-editor.js',
            'bower_components/ment.io/dist/mentio.js',
            'bower_components/rangy/rangy-core.js',
            'bower_components/rangy/rangy-selectionsaverestore.js',

            'bower_components/angular-embed/dist/angular-embed.js',
            'bower_components/angular-contenteditable/angular-contenteditable.js',
            'bower_components/angular-vs-repeat/src/angular-vs-repeat.js',

            'bower_components/momentjs/moment.js',
            'bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.js',
            'bower_components/langmap/language-mapping-list.js',
            'bower_components/angular-moment/angular-moment.js',
            'bower_components/d3/d3.js',
            'bower_components/jcrop/js/jquery.Jcrop.js',

            'bower_components/react/react.js',
            'bower_components/react/react-dom.js',
            'bower_components/classnames/index.js',

            path.join(__dirname, 'scripts/**/*.js'),
            path.join(__dirname, 'scripts/**/*.html')
        ],

        ngHtml2JsPreprocessor: {
            stripPrefix: __dirname,
            moduleName: 'superdesk.templates-cache'
        },

        junitReporter: {
            outputFile: 'test-results.xml'
        },

        // test results reporter to use
        reporters: ['dots'],

        // web server port
        port: 8080,

        // cli runner port
        runnerPort: 9100,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        browsers: ['Chrome'],

        // Continuous Integration mode
        singleRun: false
    });
};
