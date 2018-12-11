var webpack = require('webpack');

module.exports = function(grunt) {
    var config = require('../../webpack.config.js')(grunt);

    config.progress = !grunt.option('webpack-no-progress');
    config.devtool = grunt.option('webpack-devtool') || 'source-map';

    config.module.rules = config.module.rules.map((rule) => {
        if (rule.loader === 'ts-loader') {
            // skipping typechecking here to make build faster
            // types are checked in `npm run lint` using
            // typescript compiler directly which is faster
            rule.options.transpileOnly = true;
        }

        return rule;
    });

    return {
        options: config,
        build: {
            plugins: config.plugins.concat(
                new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}}),
                new webpack.optimize.UglifyJsPlugin({sourceMap: true})
            ),
        },
    };
};
