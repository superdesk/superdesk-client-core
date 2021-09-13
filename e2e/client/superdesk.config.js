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
            showCharacterLimit: 40,
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
    };
};
