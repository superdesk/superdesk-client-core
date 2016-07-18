var path = require('path');
var webpack = require('webpack');

module.exports = {
    cache: true,
    entry: {
        index: './scripts'
    },
    output: {
        path: path.join(__dirname, "dist"),
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
