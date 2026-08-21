/**
 * Karma setup for the extension's unit tests.
 *
 * Tooling (karma, webpack, jasmine, enzyme, react, superdesk-ui-framework, …)
 * is resolved from the repository root's node_modules via Node's regular
 * module lookup, so `npm ci` must have been run at the repository root; the
 * extension's own node_modules only provides its direct dependencies
 * (react-beautiful-dnd).
 */

var path = require('path');

var ROOT = path.join(__dirname, '..', '..', '..');

process.env.TZ = 'Europe/Prague';

function rootModule(moduleName) {
    return path.join(ROOT, 'node_modules', moduleName);
}

var webpackConfig = {
    mode: 'development',
    devtool: 'eval',

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        modules: [
            path.join(__dirname, 'node_modules'),
            path.join(ROOT, 'node_modules'),
            'node_modules',
        ],
        mainFields: ['module', 'browser', 'main'],
        alias: {
            // ensure a single copy of react even when a dependency
            // (e.g. react-beautiful-dnd) resolves it from another node_modules
            react: rootModule('react'),
            'react-dom': rootModule('react-dom'),
        },
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx|js|jsx)$/,
                exclude: function(absolutePath) {
                    if (absolutePath.indexOf('node_modules') === -1) {
                        return false;
                    }

                    // shipped untranspiled; the main webpack config transpiles it too
                    return !absolutePath.includes('/@sourcefabric/common/');
                },
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                    configFile: path.join(__dirname, 'tsconfig.json'),
                    compilerOptions: {
                        declaration: false,
                        outDir: undefined,
                    },
                },
            },
            {
                // css-loader without style-loader: styles become inert JS
                // modules, which is all the tests need
                test: /\.css$/i,
                use: ['css-loader'],
            },
            {
                test: /\.scss$/i,
                use: ['css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg|mov)(\?.*$|$)/,
                type: 'asset/inline',
            },
        ],
    },
};

module.exports = function(config) {
    config.set({
        basePath: __dirname,

        frameworks: ['jasmine'],

        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-sourcemap-loader'),
            require('karma-webpack'),
            require('karma-spec-reporter'),
        ],

        files: [
            'src/tests.ts',
        ],

        preprocessors: {
            'src/tests.ts': ['webpack', 'sourcemap'],
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            stats: 'errors-only',
        },

        reporters: ['spec'],

        // different from the root project's ports so both can run at once
        port: 8090,
        runnerPort: 9110,

        autoWatch: true,

        browsers: ['ChromeHeadless'],

        singleRun: false,

        browserNoActivityTimeout: 30000,

        mime: {
            'text/x-typescript': ['ts', 'tsx'],
        },
    });
};
