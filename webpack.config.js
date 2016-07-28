var path = require('path');
var webpack = require('webpack');

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

    var sdConfig = require(appConfigPath)(grunt, opts);

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
                __SUPERDESK_CONFIG__: sdConfig
            })
        ],
        resolve: {
            root: [
                path.join(__dirname),
                path.join(__dirname, '/scripts'),
                path.join(__dirname, '/app'),
                path.join(__dirname, '/styles/less')
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
