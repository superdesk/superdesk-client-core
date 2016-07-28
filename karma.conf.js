'use strict';

var grunt = require('grunt');
var makeConfig = require('./webpack.config.js');

module.exports = function(config) {
    var webpackConfig = makeConfig(grunt, {dev: false, unit: true});

    config.set({
        frameworks: [
            'jasmine'
        ],

        plugins: [
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-ng-html2js-preprocessor',
            'karma-webpack'
        ],

        preprocessors: {
            '**/*.html': ['ng-html2js'],
            'scripts/index.js': ['webpack']
        },

        webpack: webpackConfig,

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
            'bower_components/exif-js/exif.js',

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

            'scripts/superdesk/mocks.js',
            'scripts/superdesk/editor/editor.js',
            'scripts/index.js',

            'scripts/**/*.html',
            'scripts/**/*[Ss]pec.js'
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
