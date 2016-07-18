var path = require('path');
var webpack = require('webpack');

module.exports = {
    cache: true,
    entry: {
        index: './scripts'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: 'dist/',
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
            path.join(__dirname + '/scripts'),
            path.join(__dirname + '/app'),
            path.join(__dirname + '/styles/less')
        ],
        extensions: ['', '.js']
    },
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
