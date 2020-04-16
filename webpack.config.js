var path = require('path');
var webpack = require('webpack');
var lodash = require('lodash');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

function countOccurences(_string, substring) {
    return _string.split(substring).length - 1;
}

// makeConfig creates a new configuration file based on the passed options.
module.exports = function makeConfig(grunt) {
    var appConfigPath = path.join(process.cwd(), 'superdesk.config.js');

    if (process.env.SUPERDESK_CONFIG) {
        appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
    }
    if (grunt.option('config')) {
        appConfigPath = path.join(process.cwd(), grunt.option('config'));
    }

    const sdConfig = lodash.defaultsDeep(require(appConfigPath)(grunt), getDefaults(grunt));

    const apps = sdConfig.importApps || sdConfig.apps || [];

    // include only 'superdesk-core' and valid modules inside node_modules
    let validModules = ['superdesk-core'].concat(apps);

    const jQueryModule = 'jquery';

    return {
        entry: {
            app: [path.join(__dirname, 'scripts', 'index')],
        },

        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: '[name].bundle.js',
            chunkFilename: '[id].bundle.js',
        },

        plugins: [
            new webpack.ProvidePlugin({
                $: jQueryModule,
                'window.$': jQueryModule,
                jQuery: jQueryModule,
                'window.jQuery': jQueryModule,
                moment: 'moment',
                // MediumEditor needs to be globally available, because
                // its plugins will not be able to find it otherwise.
                MediumEditor: 'medium-editor',
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig),
            }),
            new ExtractTextPlugin({
                filename: '[name].bundle.css',
            }),
        ],

        resolve: {
            modules: [
                __dirname,
                path.join(__dirname, 'scripts'),
                path.join(__dirname, 'styles', 'sass'),
                'node_modules',
            ],
            alias: {
                'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-2012-2022',
                'rangy-saverestore': 'rangy/lib/rangy-selectionsaverestore',
                'angular-embedly': 'angular-embedly/em-minified/angular-embedly.min',
                'jquery-gridster': 'gridster/dist/jquery.gridster.min',
                'external-apps': path.join(process.cwd(), 'dist', 'app-importer.generated.js'),
                // ensure that react is loaded only once (3rd party apps can load more...)
                react: path.resolve('./node_modules/react'),
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },

        module: {
            rules: [
                {
                    test: /\.(ts|tsx|js|jsx)$/,
                    exclude: function(absolutePath) {
                        // Exclude files inside `WEBPACK_IGNORE` folder.
                        // This is only relevant in development.
                        // It was added to enable linking ui-framework.
                        if (absolutePath.includes('WEBPACK_IGNORE')) {
                            return true;
                        }

                        // don't exclude anything outside node_modules
                        if (absolutePath.indexOf('node_modules') === -1) {
                            return false;
                        }

                        // exclude everything else, unless it's a part of a superdesk app like superdesk-planning
                        // but is not its dependency.
                        // For example, `superdesk-planning/node_modules/**/*` will be excluded.
                        return !validModules.some(
                            (app) =>
                                absolutePath.includes(app) && countOccurences(absolutePath, '/node_modules/') === 1
                        );
                    },
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                },
                {
                    test: /\.(css|scss)$/i,
                    use: ExtractTextPlugin.extract({
                        fallback: [{
                            loader: 'style-loader',
                            options: {
                                sourceMap: true,
                            },
                        }],
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    sourceMap: true,
                                },
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: true,
                                },
                            },
                        ],
                    }),
                },
                {
                    test: /\.json$/,
                    use: ['json-loader'],
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    loader: 'file-loader',
                },
            ],
        },
    };
};

// getDefaults returns the default configuration for the app
function getDefaults(grunt) {
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
            dsn: process.env.SUPERDESK_RAVEN_DSN || '',
        },

        // backend server URLs configuration
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://0.0.0.0:5100',
        },

        // iframely settings
        iframely: {
            key: process.env.IFRAMELY_KEY || '',
        },

        // google settings
        google: {
            key: process.env.GOOGLE_KEY || '',
        },

        // settings for various analytics
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || '',
            },
            ga: {
                id: process.env.TRACKING_ID || '',
            },
        },

        // editor configuration
        editor: {
            // if true, the editor will not have a toolbar
            disableEditorToolbar: grunt.option('disableEditorToolbar'),
        },

        editor3: {
            browserSpellCheck: false,
        },

        // default timezone for the app
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss',
        },

        // view formats for datepickers/timepickers
        view: {
            dateformat: process.env.VIEW_DATE_FORMAT || 'DD/MM/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm',
        },

        // if environment name is not set
        isTestEnvironment: !!grunt.option('environmentName') || !!process.env.SUPERDESK_ENVIRONMENT,

        // environment name
        environmentName: grunt.option('environmentName') || process.env.SUPERDESK_ENVIRONMENT,

        // route to be redirected to from '/'
        defaultRoute: '/workspace',

        // override language translations
        langOverride: {},

        // app features
        features: {
            // tansa spellchecker
            useTansaProofing: false,

            // replace editor2
            onlyEditor3: false,
        },

        // workspace defaults
        workspace: {
            ingest: false,
            content: false,
            tasks: false,
            analytics: false,
        },

        // ingest defaults
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: true,
                show_ingest_count: true,
                show_time: true,
                log_messages: 'error',
                show_status: true,
            },
            DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
            DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
        },

        // list of languages available in user profile
        profileLanguages: [
            'en',
            'el',
            'en_GB',
            'fr_CA',
            'es',
            'da',
            'ar',
            'de_DE',
            'ru_RU',
            'nb',
            'uk_UA',
            'pt_BR',
            'pl',
        ],
    };
}
