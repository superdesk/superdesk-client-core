var path = require('path');
var grunt = require('grunt');
var makeConfig = require('./webpack.config.js');

process.env.TZ = 'Europe/Prague';

module.exports = function(config) {
    var webpackConfig = makeConfig(grunt);

    // in karma, entry is read from files prop
    webpackConfig.entry = null;
    webpackConfig.devtool = 'eval';
    webpackConfig.mode = 'development';

    // override typescript include to match scripts
    var typescriptRule = webpackConfig.module.rules.find((rule) => rule.loader === 'ts-loader');
    typescriptRule.exclude = [];
    typescriptRule.include = [
        path.join(__dirname, 'scripts'),
        path.join(__dirname, 'node_modules', 'htmlparser2'),
        path.join(__dirname, 'node_modules', 'parse5'),
    ];

    config.set({
        frameworks: [
            'jasmine',
        ],

        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'karma-ng-html2js-preprocessor',
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-spec-reporter',
        ],

        preprocessors: {
            '**/*.html': ['ng-html2js'],
            'scripts/tests.ts': ['webpack', 'sourcemap'],
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            chunks: false,
            modules: false,
            stats: false,
            debug: false,
            progress: false,
            // quiet: true
            watchOptions: {
                ignored: path.join(__dirname, 'scripts', 'extensions'),
            },
        },

        files: [
            'scripts/tests.ts',
            'scripts/**/*.html',
            { 
                pattern: 'fixtures/**/*',
                watched: false,
                included: false,
            }
        ],

        ngHtml2JsPreprocessor: {
            stripPrefix: __dirname,
            moduleName: 'superdesk.templates-cache',
        },

        // test results reporter to use
        // options: 'progress', 'dots', 'spec'(via "karma-spec-reporter" package)
        reporters: ['spec'],

        // web server port
        port: 8080,

        // cli runner port
        runnerPort: 9100,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        browsers: ['ChromeHeadless'],

        // Continuous Integration mode
        singleRun: false,

        // Seams default 10s is not enough for CI sometime, so let's try 30s
        browserNoActivityTimeout: 30000,

        // Allow typescript files
        mime: {
            'text/x-typescript': ['ts', 'tsx'],
        },
    });
};
