
module.exports = function(grunt) {
    'use strict';

    var base = ['<%= distDir %>', '<%= appDir %>', '.', '<%= coreDir %>'];

    return {
        options: {
            port: 9000,
            livereload: '<%= livereloadPort %>'
        },
        test: {
            options: {
                base: base,
                middleware: function(connect, options, middlewares) {
                    middlewares.unshift(mockTemplates);
                    middlewares.unshift(nocacheHeaders);
                    return middlewares;

                    // avoid 404 in dev server for templates
                    function mockTemplates(req, res, next) {
                        if (req.url.includes('templates-cache.js')) {
                            // return empty
                            return res.end('');
                        } else {
                            return next();
                        }
                    }

                    // tell browser not to cache files
                    function nocacheHeaders(req, res, next) {
                        res.setHeader(
                            'Cache-Control',
                            'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
                        next();
                    }
                }
            }
        },
        travis: {
            options: {
                base: base,
                keepalive: true,
                livereload: false,
                port: 9000
            }
        },
        mock: {
            options: {
                base: base,
                keepalive: true,
                livereload: false,
                port: 9090
            }
        },
        build: {
            options: {
                base: ['<%= distDir %>'],
                port: 9090,
                livereload: false,
                keepalive: true
            }
        }
    };
};
