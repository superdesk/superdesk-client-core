var path = require('path');
var webpack = require('webpack');

// base webpack configuration
var baseConfig = {
    cache: true,
    entry: {
        index: 'scripts/index.js'
    },
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[id].bundle.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery'
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


// proxyConfig returns the proxy configuration based on whether the client core
// is embedded as a node module into a different repo (such as the main superdesk
// repo), or if it is not. If the client is embedded, some request URLs (such as
// ones starting with 'scripts/' and 'images/') will be prepended with
// './node_modules/superdesk-core'.
function proxyConfig() {
    var isModule = require('fs').existsSync('./node_modules/superdesk-core');
    if (!isModule) {
        return {};
    }
    var rewrite = {
        target: 'http://localhost:9000',
        rewrite: function(req) {
            'use strict';
            req.url = 'node_modules/superdesk-core' + req.url;
        }
    };
    return {
        '/scripts/*': rewrite,
        '/images/*': rewrite
    };
}

module.exports = function(grunt, isDev) {
    var appConfigPath = grunt.option('config') ||
        process.env.SUPERDESK_CONFIG ||
        './superdesk.config.js';

    baseConfig.output.publicPath = isDev ? 'dist' : '';
    baseConfig.proxy = proxyConfig();
    baseConfig.plugins = baseConfig.plugins.concat(
        new webpack.DefinePlugin({
            __SUPERDESK_CONFIG__: require(appConfigPath)(grunt)
        }));

    return baseConfig;
}
