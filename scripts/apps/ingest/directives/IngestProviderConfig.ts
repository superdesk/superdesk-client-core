/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestProviderConfig
 *
 * @description Renders the config fields.
 */
export function IngestProviderConfig() {
    return {
        template: require('../views/settings/service-config.html'),
    };
}
