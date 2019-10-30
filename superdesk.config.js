/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */

module.exports = function(grunt) {
    return {
        defaultRoute: '/workspace',
        features: {
            swimlane: {defaultNumberOfColumns: 4},
            editor3: true,
            qumu: true,
            savedSearch: {
                subscriptions: true,
            },
            validatePointOfInterestForImages: true,
            hideRoutedDesks: false,
        },
        auth: {google: false},
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: true,
                show_ingest_count: true,
                show_time: true,
                log_messages: 'error',
                show_status: true,
            },
            DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
            DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
        },

        enabledExtensions: {
            // helloWorld: 1,
            planning: 1,
        },
    };
};
