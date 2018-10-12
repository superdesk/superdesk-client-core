/**
 * @ngdoc directive
 * @module superdesk.apps.ingest
 * @name sdIngestConfigErrors
 *
 * @description Renders the errors related to the ingest provider configuration.
 */
export function IngestConfigErrors() {
    return {
        template: require('../views/settings/ingest-config-errors.html'),
    };
}
