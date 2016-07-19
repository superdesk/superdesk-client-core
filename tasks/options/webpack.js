var webpack = require('webpack');
var webpackConfig = require('../../webpack.config.js');

module.exports = {
    options: webpackConfig,
    build: {
        plugins: webpackConfig.plugins.concat(
            new webpack.DefinePlugin({
                'process.env': {'NODE_ENV': JSON.stringify('production')}
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin()
        )
    }
};
