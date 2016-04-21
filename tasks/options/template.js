
module.exports = function(grunt) {

    'use strict';

    function data(url, forceUrl) {

        var server = grunt.option('server') || process.env.SUPERDESK_URL || url;
        var ws = grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100';
        var disableEditorToolbar = grunt.option('disableEditorToolbar');
        var defaultTimezone = grunt.option('defaultTimezone') || 'Europe/London';

        if (forceUrl) {
            server = url;
        }

        var config = {
            version: grunt.config.process('<%= pkg.version %>'),

            raven: {dsn: process.env.SUPERDESK_RAVEN_DSN || ''},
            server: {url: server, ws: ws},
            iframely: {key: process.env.IFRAMELY_KEY || ''},
            analytics: {
                piwik: {
                    url: process.env.PIWIK_URL || '',
                    id: process.env.PIWIK_SITE_ID || ''
                },
                ga: {
                    id: process.env.TRACKING_ID || ''
                }
            },
            editor: {disableEditorToolbar: disableEditorToolbar},
            defaultTimezone: defaultTimezone,
            //these are angular model formats, should be consistent throughout the application
            model: {
                dateformat: 'DD/MM/YYYY',
                timeformat: 'HH:mm:ss'
            },
            //view formats for datepickers/timepickers.
            //KEEP DEFAULTS DIFFERENT FROM MODEL (for testing purposes)
            view: {
                dateformat: process.env.VIEW_DATE_FORMAT || 'MM/DD/YYYY',
                timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
            }
        };

        return {data: {
            config: config,
            bower: 'bower_components',
            core: 'node_modules/superdesk-core/apps'
        }};
    }

    var files = {'<%= distDir %>/index.html': '<%= appDir %>/index.html'};

    return {
        mock: {
            options: data('http://localhost:5000/api', true),
            files: files
        },
        travis: {
            options: data('http://localhost:5000/api'),
            files: files
        },
        test: {
            options: data('http://localhost:5000/api'),
            files: {'<%= distDir %>/index.html': '<%= appDir %>/index.html'}
        },
        docs: {
            files: {'<%= distDir %>/docs.html': '<%= appDir %>/docs.html'}
        }
    };
};
