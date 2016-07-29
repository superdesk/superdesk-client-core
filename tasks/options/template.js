var path = require('path');

module.exports = function(grunt) {

    'use strict';

    var version;

    try {
        var git = require('git-rev-sync');
        version = git.short('..');
    } catch (err) {
        // pass
    }

    function data(url, forceUrl) {

        var server = grunt.option('server') || process.env.SUPERDESK_URL || url;
        var ws = grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100';
        var disableEditorToolbar = grunt.option('disableEditorToolbar');
        var defaultTimezone = grunt.option('defaultTimezone') || 'Europe/London';

        //environment parameter is used to indicate a non-prod environment
        var isTestEnvironment = !!grunt.option('environmentName');
        var environmentName = grunt.option('environmentName');

        if (forceUrl) {
            server = url;
        }

        var config = {
            version: version || grunt.config.process('<%= pkg.version %>'),

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
            },
            isTestEnvironment: isTestEnvironment,
            environmentName: environmentName
        };

        return {data: {
            config: config,
            bower: 'bower_components',
            core: 'node_modules/superdesk-core/apps'
        }};
    }

    var indexSrc = path.join('<%= coreDir %>', '<%= appDir %>/index.html');
    var files = {'<%= distDir %>/index.html': indexSrc};

    return {
        mock: {
            options: data('http://localhost:5000/api', true),
            files: files
        },
        dev: {
            options: data('http://localhost:5000/api'),
            files: {'index.html': indexSrc}
        },
        travis: {
            options: data('http://localhost:5000/api'),
            files: files
        },
        test: {
            options: data('http://localhost:5000/api'),
            files: files
        },
        docs: {
            options: data('http://localhost:5000/api'),
            files: {'<%= distDir %>/docs.html': '<%= appDir %>/docs.html'}
        }
    };
};
