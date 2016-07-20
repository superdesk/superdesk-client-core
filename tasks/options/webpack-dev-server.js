var o = require('../../webpack.config.js');

module.exports = {
    options: {
        webpack: {
            cache: o.cache,
            entry: o.entry,
            output: {
                path: o.output.path,
                publicPath: 'dist',
                filename: o.output.filename,
                chunkFilename: o.output.chunkFilename
            },
            plugins: o.plugins,
            resolve: o.resolve,
            module: o.module
        },
        publicPath: '/dist',
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
