/**
 *
 * This is the default configuration file for the Superdesk application.
 * For different build configurations, you may use other files which return these
 * value and set them via the OS environment variable SUPERDESK_CONFIG.
 *
 * ie. running a server with a different build file would become:
 * `SUPERDESK_CONFIG=./other.conf.js grunt server`
 *
 */
var path = require('path');
var version;

// attempt to fetch git revision and allow failure
try { version = require('git-rev-sync').short('..'); } catch (err) {}

module.exports = function(grunt) {
    return JSON.stringify({
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')),
        raven: {
            dsn: process.env.SUPERDESK_RAVEN_DSN || ''
        },
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100'
        },
        iframely: {
            key: process.env.IFRAMELY_KEY || ''
        },
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || ''
            },
            ga: {
                id: process.env.TRACKING_ID || ''
            }
        },
        editor: {
            disableEditorToolbar: grunt.option('disableEditorToolbar')
        },
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss'
        },
        view: {
            // View formats for datepickers/timepickers.
            // Keep defaults different from model (for testing purposes)
            dateformat: process.env.VIEW_DATE_FORMAT || 'MM/DD/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
        },
        isTestEnvironment: !!grunt.option('environmentName'),
        environmentName: grunt.option('environmentName')
    });
};
