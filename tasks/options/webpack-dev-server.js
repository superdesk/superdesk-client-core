var webpackConfig = require('../../webpack.config.js');

module.exports = {
    options: {
        webpack: webpackConfig,
        publicPath: '/' + webpackConfig.output.publicPath,
        port: 9000
    },
    start: {
        keepAlive: true,
        webpack: {
            devtool: 'eval',
            debug: true
        }
    }
};
