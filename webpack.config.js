var path = require('path');
var webpack = require('webpack');
var _ = require('lodash');

// makeConfig creates a new configuration file based on the passed options.
// Keys are:
// {
//     dev: bool  // indicates dev server is running (non-prod)
//     unit: bool // indicates unit tests are running
// }
module.exports = function makeConfig(grunt, opts) {
    opts = opts || {};
    var appConfigPath = path.join(process.cwd(), 'superdesk.config.js');

    if (process.env.SUPERDESK_CONFIG) {
        appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
    }
    if (grunt.option('config')) {
        appConfigPath = path.join(process.cwd(), grunt.option('config'));
    }

    var sdConfig = _.defaultsDeep(require(appConfigPath)(grunt), getDefaults(grunt, opts));

    return {
        cache: true,
        entry: {
            index: 'scripts/index.js'
        },
        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: '[name].bundle.js',
            publicPath: opts.dev ? 'dist' : '',
            chunkFilename: '[id].bundle.js'
        },
        plugins: [
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery'
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig)
            })
        ],
        resolve: {
            root: [
                __dirname,
                path.join(__dirname, '/scripts'),
                path.join(__dirname, '/app'),
                path.join(__dirname, '/styles/less'),
                process.cwd()
            ],
            extensions: ['', '.js']
        },
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: function(p) {
                        'use strict';
                        // exclude parsing bower components and node modules,
                        // but allow the 'superdesk-core' node module, because
                        // it will be used when building in the main 'superdesk'
                        // repository.
                        return p.indexOf('bower_components') > -1 ||
                            p.indexOf('node_modules') > -1 && p.indexOf('superdesk-core') < 0;
                    },
                    loader: 'babel',
                    query: {
                        cacheDirectory: true,
                        presets: ['es2015']
                    }
                },
                {
                    test: /\.less$/,
                    loader: 'style!css!less'
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    loader: 'file-loader'
                }
            ]
        }
    };
};

// getDefaults returns the default configuration for the app
function getDefaults(grunt, buildParams) {
    var version;

    try {
        version = require('git-rev-sync').short('..');
    } catch (err) {
        // pass
    }

    return {
        // application version
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')).version,

        // raven settings
        raven: {
            dsn: process.env.SUPERDESK_RAVEN_DSN || ''
        },

        // backend server URLs configuration
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100'
        },

        // iframely settings
        iframely: {
            key: process.env.IFRAMELY_KEY || ''
        },

        // settings for various analytics
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || ''
            },
            ga: {
                id: process.env.TRACKING_ID || ''
            }
        },

        // editor configuration
        editor: {
            // if true, the editor will not have a toolbar
            disableEditorToolbar: grunt.option('disableEditorToolbar')
        },

        // default timezone for the app
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss'
        },

        // view formats for datepickers/timepickers
        view: {
            // keep defaults different from model (for testing purposes)
            dateformat: process.env.VIEW_DATE_FORMAT || 'MM/DD/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
        },

        // if environment name is not set
        isTestEnvironment: !!grunt.option('environmentName'),

        // environment name
        environmentName: grunt.option('environmentName'),

        // the params used to generate the webpack configuration file
        // see webpack.config.js
        buildParams: buildParams,

        // route to be redirected to from '/'
        defaultRoute: '/workspace',

        // array of spellcheckers (ie. ["tansa"])
        spellcheckers: []
    };
}
