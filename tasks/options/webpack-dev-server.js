var o = require('../../webpack.config.js');

var config = {
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

// if the client-core is a node module, then we are in the main repo
// and we need to rewrite some request URLs such as 'scripts/' and
// 'images/' to 'node_modules/scripts/' and 'node_modules/images/'.
var isModule = require('fs').existsSync('./node_modules/superdesk-core');
if (isModule) {
    var rewrite = {
        target: 'http://localhost:9000',
        rewrite: function(req) {
            'use strict';
            req.url = 'node_modules/superdesk-core' + req.url;
        }
    };
    config.start.proxy = {
        '/scripts/*': rewrite,
        '/images/*': rewrite
    };
}

module.exports = config;
