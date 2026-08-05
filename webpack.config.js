var path = require('path');
// Resolve webpack from the consumer so this config builds plugins with the same copy the
// compiler uses. In a linked dev setup the consumer and this repo have separate installs,
// and webpack >= 5.107 rejects a compilation created by a different copy.
var webpack = require(require.resolve('webpack', {paths: [process.cwd(), __dirname]}));
var lodash = require('lodash');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const fs = require('fs');

function getModuleDir(moduleName) {
    return path.join(
        require.resolve(
            moduleName + '/package.json',
            {paths: [__dirname, process.cwd()]}
        ),
        '../'
    );
}

function countOccurrences(_string, substring) {
    return _string.split(substring).length - 1;
}

function applyDefaults(appConfig) {
    if (appConfig.startingDay == null) {
        appConfig.startingDay = '0'; // sunday
    }

    if (appConfig.shortTimeFormat == null) {
        appConfig.shortTimeFormat = 'HH:mm'; // 24h format
    }

    if (appConfig.ui == null) {
        appConfig.ui = {};
    }

    if (appConfig.ui.sendEmbargo == null) {
        appConfig.ui.sendEmbargo = false;
    }

    if (appConfig.ui.italicAbstract == null) {
        appConfig.ui.italicAbstract = true;
    }

    if (appConfig.ui.publishEmbargo == null) {
        appConfig.ui.publishEmbargo = true;
    }

    if (appConfig.authoring == null) {
        appConfig.authoring = {};
    }

    if (appConfig.authoring.panels == null) {
        appConfig.authoring.panels = {};
    }

    if (appConfig.authoring.panels.publish == null) {
        appConfig.authoring.panels.publish = {};
    }

    if (appConfig.authoring.panels.publish.publishSchedule == null) {
        appConfig.authoring.panels.publish.publishSchedule = true;
    }

    if (appConfig.authoring.panels.publish.publishingTarget == null) {
        appConfig.authoring.panels.publish.publishingTarget = true;
    }

    if (appConfig.authoring.panels.sendTo == null) {
        appConfig.authoring.panels.sendTo = {};
    }

    if (appConfig.authoring.panels.sendTo.publishSchedule == null) {
        appConfig.authoring.panels.sendTo.publishSchedule = false;
    }

    const defaultDateFormat = 'MM/DD';
    const defaultTimeFormat = 'hh:mm';

    if (appConfig.view == null) {
        appConfig.view = {
            dateformat: defaultDateFormat,
            timeformat: defaultTimeFormat,
        };
    }

    if (appConfig.view.dateformat == null) {
        appConfig.view.dateformat = defaultDateFormat;
    }

    if (appConfig.view.timeformat == null) {
        appConfig.view.timeformat = defaultTimeFormat;
    }

    if (appConfig.longDateFormat == null) {
        appConfig.longDateFormat = 'LLL';
    }

    if (appConfig.features == null) {
        appConfig.features = {};
    }

    if (appConfig.features.autorefreshContent == null) {
        appConfig.features.autorefreshContent = true; // default to true
    }
}

// makeConfig creates a new webpack configuration.
module.exports = function makeConfig(grunt) {
    var appConfigPath = path.join(process.cwd(), 'superdesk.config.js');

    if (process.env.SUPERDESK_CONFIG) {
        appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
    }
    if (grunt.option('config')) {
        appConfigPath = path.join(process.cwd(), grunt.option('config'));
    }

    const sdConfig = lodash.defaultsDeep(require(appConfigPath)(grunt), getDefaults(grunt));

    applyDefaults(sdConfig);

    const apps = sdConfig.importApps || sdConfig.apps || [];

    // include only 'superdesk-core' and valid modules inside node_modules
    let validModules = [
        'superdesk-core',
        'planning', // on fireq we store superdesk-planning in linked `planning` folder
    ].concat(apps);

    const jQueryModule = getModuleDir('jquery');

    const superdeskCorePath = process.cwd() === __dirname
        ? __dirname // when running unit tests from this project
        : getModuleDir('superdesk-core');

    const uiFrameworkInsideClientCore = path.join(superdeskCorePath, 'node_modules/superdesk-ui-framework');

    const uiFrameworkPath =
        fs.existsSync(uiFrameworkInsideClientCore)
            ? uiFrameworkInsideClientCore
            : getModuleDir('superdesk-ui-framework');

    const sassLoadPaths = [
        path.join(__dirname, 'styles', 'sass'),
        path.join(__dirname, 'node_modules'),
        path.join(process.cwd(), 'node_modules'),
    ];

    const transpilationExcludes = function(absolutePath) {
        // don't exclude anything outside node_modules
        if (absolutePath.indexOf('node_modules') === -1) {
            return false;
        }

        // Exclude these packages - they are pre-built ESM modules
        if (
            absolutePath.includes('/@babel/runtime/')
            || absolutePath.includes('/react-resizable-panels/')
        ) {
            return true;
        }

        if (
            // date-fns uses optional chaining and nullish coalescing
            absolutePath.includes('/node_modules/date-fns/')

            // @sourcefabric/date-fns-tz uses logical OR assignment operator ||=
            || absolutePath.includes('/@sourcefabric/date-fns-tz/')

            || absolutePath.includes('/@sourcefabric/common/')
        ) {
            return false;
        }

        // exclude everything else, unless it's a part of a superdesk app like superdesk-planning
        // but is not its dependency.
        // For example, `superdesk-planning/node_modules/**/*` will be excluded.
        const exclude = !validModules.some(
            (app) =>
                absolutePath.includes(app) && countOccurrences(absolutePath, '/node_modules/') === 1
        );

        return exclude;
    };

    // Mirrors what ts-loader produced via scripts/tsconfig.json:
    // ES5 output, classic JSX, CommonJS modules, babel-style interop.
    // isModule "unknown" matches tsc: files without import/export are left
    // as scripts, so legacy sloppy-mode code doesn't get "use strict" forced on it.
    const swcOptions = (parser) => ({
        isModule: 'unknown',
        module: {type: 'commonjs'},
        jsc: {
            target: 'es5',
            parser: parser,
            transform: {react: {runtime: 'classic'}},
        },
    });

    // node_modules content is normally assumed immutable per package version, but:
    // - superdesk app packages are installed from git branches (or symlinked)
    //   and change without a version bump
    // - immutable is patched in place by patch-package (currently type-declaration
    //   changes only, but a future runtime patch must not be served stale from cache)
    // Exclude them (negative lookahead) so content edits invalidate the cache.
    const managedPathsPattern =
        /^(.+?[\\/]node_modules[\\/](?!superdesk|planning[\\/]|immutable[\\/])(@[^\\/]+[\\/])?(?!@)[^\\/]+)[\\/]/;

    return {
        // Persistent cache: cold data is written on first run, warm starts
        // then skip transform/resolution work for unchanged modules.
        cache: {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename, appConfigPath],
            },
        },

        snapshot: {
            managedPaths: [managedPathsPattern],
        },
        entry: {
            init: path.join(__dirname, 'scripts', 'init'),
            app: path.join(__dirname, 'scripts', 'index'),
        },

        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: '[name].bundle.js',
            chunkFilename: '[id].bundle.js',
            pathinfo: false,
        },

        plugins: [
            new webpack.ProvidePlugin({
                $: jQueryModule,
                'window.$': jQueryModule,
                jQuery: jQueryModule,
                'window.jQuery': jQueryModule,
                moment: 'moment',
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig),
            }),
            new MiniCssExtractPlugin({
                filename: '[name].bundle.css',
                chunkFilename: '[id].bundle.css',
            }),

            // Webpack 5 removed automatic Node.js polyfills for browser builds
            // This plugin restores them for legacy code that depends on Node APIs (e.g., Buffer, process, stream)
            // Exclude 'console' since browsers provide their own implementation
            new NodePolyfillPlugin({
                excludeAliases: ['console'],
            }),
        ],

        resolve: {
            modules: [
                __dirname,
                path.join(__dirname, 'scripts'),
                path.join(__dirname, 'styles', 'sass'),
                path.join(__dirname, 'node_modules'),
                'node_modules',
            ],
            mainFields: ['module', 'browser', 'main'],
            alias: {
                'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-10-year-range',
                'rangy-saverestore': 'rangy/lib/rangy-selectionsaverestore',
                'angular-embedly': 'angular-embedly/em-minified/angular-embedly.min',
                'jquery-gridster': 'gridster/dist/jquery.gridster.min',
                'external-apps': path.join(process.cwd(), 'dist', 'app-importer.generated.js'),
                'shallow-equal': 'shallow-equal/dist/index',
                '@uswriting/exiftool/cjs': require.resolve('@uswriting/exiftool/cjs'),

                /**
                 * Ensure that react is loaded only once.
                 * external apps(planning, analytics, ui-framework) may try loading their own react,
                 * especially when linked with npm in development mode.
                 */
                react: getModuleDir('react'),
                'react-dom': getModuleDir('react-dom'),

                /**
                 * Required for development mode only.
                 * Otherwise throws "Invariant Violation: block is not a BlockNode" error
                 * which is likely due to multiple instances of the library being loaded.
                 * The error is only thrown in certain execution branches.
                 */
                'draft-js': getModuleDir('@sourcefabric/draft-js'),

                /**
                 * Required for development mode only.
                 * Ensures that superdesk apps loaded via superdesk.config.js (planning, analytics)
                 * use a single version of superdesk-core.
                 *
                 * NOTE: superdesk apps themselves are unaware of this config
                 * and you will see import errors in code editor
                 * with a superdesk app open and superdesk-core not installed.
                 * running `npm link superdesk-core` inside of a superdesk app fixes this.
                 */
                'superdesk-core': superdeskCorePath,

                'superdesk-ui-framework': uiFrameworkPath,
            },
            extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: transpilationExcludes,
                    loader: require.resolve('swc-loader'),
                    options: swcOptions({syntax: 'typescript', tsx: true}),
                },
                {
                    test: /\.jsx?$/,
                    exclude: transpilationExcludes,
                    loader: require.resolve('swc-loader'),
                    options: swcOptions({syntax: 'ecmascript', jsx: true}),
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader',
                },
                {
                    test: /\.css$/i,
                    use: [
                        {loader: MiniCssExtractPlugin.loader},
                        {
                            loader: 'css-loader',
                            options: {
                                modules: 'global',
                            },
                        },
                    ],
                },
                {
                    test: /\.scss$/i,
                    use: [
                        {loader: MiniCssExtractPlugin.loader},
                        {
                            loader: 'css-loader',
                            options: {
                                modules: 'global',
                            },
                        },
                        {
                            loader: require.resolve('sass-loader'),
                            options: {
                                // sass-embedded with a shared compiler process
                                // is several times faster than the pure-js sass package
                                implementation: require.resolve('sass-embedded'),
                                api: 'modern-compiler',
                                sassOptions: {
                                    loadPaths: sassLoadPaths,
                                    quietDeps: true,
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg|mov)(\?.*$|$)/,
                    type: 'asset/resource',
                },
                {
                    // Required for @uswriting/exiftool which contains embedded Perl code in a .cjs file
                    // Without this, webpack 5 tries to parse it as an ES module and fails
                    test: /\.cjs$/,
                    type: 'javascript/auto',
                },
                {
                    test: /\.wasm$/,
                    type: 'asset/resource',
                },
            ],
        },
        devServer: {
            port: 9000,
            host: '0.0.0.0',
            compress: true,
            headers: {'Cache-Control': 'no-store'},
            // Errors stay visible; warnings hidden because the warning
            // overlay iframe intercepts pointer events during Playwright runs.
            client: {overlay: {errors: true, warnings: false}},
            static: [
                {directory: path.resolve(process.cwd(), 'dist')},
                {directory: path.resolve(__dirname, 'scripts'), publicPath: '/scripts'},
                {directory: path.resolve(__dirname, 'images'), publicPath: '/images'},
                {directory: path.resolve(__dirname, 'styles'), publicPath: '/styles'},
                {directory: path.resolve(__dirname, 'fonts'), publicPath: '/fonts'},
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
            'ja',
            'sr',
        ],

        userOnlineMinutes: 15,
    };
}
