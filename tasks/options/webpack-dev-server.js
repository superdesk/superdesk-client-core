var path = require('path');
var makeConfig = require('../../webpack.config.js');

module.exports = function(grunt) {
    var webpackConfig = makeConfig(grunt);

    return {
        // shows original TypeScript in browser devtools; not meaningfully slower
        // than webpack's default (eval) once the filesystem cache is warm
        start: Object.assign(
            {mode: 'development', devtool: 'eval-cheap-module-source-map'},
            webpackConfig
        ),

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
