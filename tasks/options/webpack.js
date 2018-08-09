var webpack = require('webpack');

module.exports = function(grunt) {
    var config = require('../../webpack.config.js')(grunt);

    config.progress = !grunt.option('webpack-no-progress');
    config.devtool = grunt.option('webpack-devtool') || 'cheap-source-map';
    config.optimization = {minimize: true};

    return {
        options: config,
        build: {
            plugins: config.plugins.concat(
                new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}})
            ),
        },
    };
};
