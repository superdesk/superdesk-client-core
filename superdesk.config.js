/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */

module.exports = function(grunt) {
    return {
        defaultRoute: '/workspace',
        requiredMediaMetadata: ['headline', 'description_text', 'alt_text'],
        publisher: {
            protocol: 'http',
            tenant: 'default',
            domain: 'ljuba.s-lab.sourcefabric.org',
            base: 'api/v1'
        },
        features: {
            swimlane: {columnsLimit: 4}
        }
    };
};
