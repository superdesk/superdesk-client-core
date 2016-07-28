module.exports = function(grunt) {
    var isModule = require('fs').existsSync('./node_modules/superdesk-core');
    var rewrite = {
        target: 'http://localhost:9000',
        rewrite: function(req) {
            'use strict';
            req.url = 'node_modules/superdesk-core' + req.url;
        }
    };

    return {
        options: {
            webpack: require('../../webpack.config.js')(grunt, {dev: true}),
            publicPath: '/dist',
            port: 9000,
            headers: {
                'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
            }
        },
        start: {
            keepAlive: true,
            proxy: isModule ? {
                '/scripts/*': rewrite,
                '/images/*': rewrite
            } : {},
            webpack: {
                devtool: 'eval',
                debug: true
            }
        }
    };
};
