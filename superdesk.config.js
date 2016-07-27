/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */
var path = require('path');
var version;

// attempt to fetch git revision and allow failure
try { version = require('git-rev-sync').short('..'); } catch (err) {}

// The return value of the function is passed into the app via Webpack's
// DefinePlugin as the global __SUPERDESK_CONFIG__ (see webpack.config.js).
module.exports = function(grunt) {
    return JSON.stringify({
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')).version,
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
