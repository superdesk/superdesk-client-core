var webpackConfig = require('../../webpack.config.js');

module.exports = {
    options: {
        webpack: webpackConfig,
        publicPath: '/' + webpackConfig.output.publicPath,
        port: 9000,
        headers: {
            'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
        }
    },
    start: {
        keepAlive: true,
        webpack: {
            devtool: 'eval',
            debug: true
        }
    }
};
