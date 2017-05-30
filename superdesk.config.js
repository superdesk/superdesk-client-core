/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */

module.exports = function(grunt) {
    return {
        defaultRoute: '/workspace',
        validatorMediaMetadata: {
            headline: {
                required: true
            },
            alt_text: {
                required: true
            },
            archive_description: {
                required: false
            },
            description_text: {
                required: true
            },
            copyrightholder: {
                required: false
            },
            byline: {
                required: false
            },
            usageterms: {
                required: false
            },
            copyrightnotice: {
                required: false
            }
        },
        publisher: {
            protocol: 'http',
            tenant: 'master.s-lab',
            domain: 'sourcefabric.org',
            base: 'api/v1'
        },
        features: {
            swimlane: {columnsLimit: 4}
        },
        auth: {google: false},
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: true,
                show_ingest_count: true,
                show_time: true,
                log_messages: 'error',
                show_status: true
            },
            DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
            DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
        }
    };
};
