var path = require('path');
var makeConfig = require('../../webpack.config.js');

module.exports = function(grunt) {
    var webpackConfig = makeConfig(grunt, {typeCheck: true});

    return {
        start: Object.assign({mode: 'development'}, webpackConfig),

        'ui-guide': {
            keepAlive: true,
            contentBase: './docs/ui-guide/dist',
            port: 9100,
            webpack: {
                entry: {
                    docs: ['webpack-dev-server/client?http://localhost:9100/', 'docs/ui-guide/index'],
                },
                output: {
                    path: path.join(process.cwd(), 'docs/ui-guide/dist'),
                    publicPath: 'docs/dist',
                },
                devtool: 'eval',
                debug: true,
            },
        },
    };
};
