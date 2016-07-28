/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */
var path = require('path');
var version;

try {
    version = require('git-rev-sync').short('..');
} catch (err) {
    // pass
}

// The return value of the function is passed into the app via Webpack's
// DefinePlugin as the global __SUPERDESK_CONFIG__ (see webpack.config.js).
module.exports = function(grunt, buildParams) {
    return JSON.stringify({
        // application version
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')).version,

        // raven settings
        raven: {
            dsn: process.env.SUPERDESK_RAVEN_DSN || ''
        },

        // backend server URLs configuration
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://localhost:5100'
        },

        // iframely settings
        iframely: {
            key: process.env.IFRAMELY_KEY || ''
        },

        // settings for various analytics
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || ''
            },
            ga: {
                id: process.env.TRACKING_ID || ''
            }
        },

        // editor configuration
        editor: {
            // if true, the editor will not have a toolbar
            disableEditorToolbar: grunt.option('disableEditorToolbar')
        },

        // default timezone for the app
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss'
        },

        // view formats for datepickers/timepickers
        view: {
            // keep defaults different from model (for testing purposes)
            dateformat: process.env.VIEW_DATE_FORMAT || 'MM/DD/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm'
        },

        // if environment name is not set
        isTestEnvironment: !!grunt.option('environmentName'),

        // environment name
        environmentName: grunt.option('environmentName'),

        // the params used to generate the webpack configuration file
        // see webpack.config.js
        buildParams: buildParams,

        // route to be redirected to from '/'
        defaultRoute: '/workspace/personal'
    });
};
