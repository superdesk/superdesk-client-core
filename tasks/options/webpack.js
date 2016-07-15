var path = require('path');
var webpack = require('webpack');

// webpack.config
var appDir = path.dirname(path.dirname(__dirname));
var options = {
    cache: true,
    entry: {
        index: './scripts'
    },
    output: {
        path: path.join(appDir, "dist"),
        publicPath: 'dist/',
        filename: '[name].bundle.js',
        chunkFilename: '[id].bundle.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: "jquery",
            $: "jquery"
        })
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015']
                }
            }
        ]
    }
};

module.exports = {
    options: options,
    build: {
        plugins: options.plugins.concat(
            new webpack.DefinePlugin({
                "process.env": {
                    // This has effect on the React lib size
                    "NODE_ENV": JSON.stringify("production")
                }
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin()
        )
    },
    "build-dev": {
        devtool: "sourcemap",
        debug: true
    }
};
