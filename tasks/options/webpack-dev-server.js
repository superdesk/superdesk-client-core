var path = require('path');
var makeConfig = require('../../webpack.config.js');

module.exports = function(grunt) {
    var webpackConfig = makeConfig(grunt);

    return {
        options: {
            webpack: webpackConfig,
            contentBase: [
                path.join(process.cwd(), 'dist'),
                path.dirname(path.dirname(__dirname))
            ],
            port: 9000,
            host: '0.0.0.0',
            headers: {
                'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
            }
        },

        start: {
            webpack: {devtool: 'eval'}
        },

        'ui-guide': {
            keepAlive: true,
            contentBase: './docs/ui-guide/dist',
            port: 9100,
            webpack: {
                entry: {
                    docs: ['webpack-dev-server/client?http://localhost:9100/', 'docs/ui-guide/index']
                },
                output: {
                    path: path.join(process.cwd(), 'docs/ui-guide/dist'),
                    publicPath: 'docs/dist'
                },
                devtool: 'eval',
                debug: true
            }
        }
    };
};
