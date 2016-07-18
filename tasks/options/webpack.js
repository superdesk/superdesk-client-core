var webpack = require('webpack');
var webpackConfig = require('../../webpack.config.js');

module.exports = {
    options: webpackConfig,
    build: {
        plugins: webpackConfig.plugins.concat(
            new webpack.DefinePlugin({
                'process.env': {
                    // This has effect on the React lib size
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin()
        )
    },
    'build-dev': {
        devtool: 'sourcemap',
        debug: true
    }
};
