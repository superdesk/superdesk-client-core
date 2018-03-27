var Raven = require('raven-js');

export class Logger {
    constructor(config) {
        if (config.raven && config.raven.dsn.length > 0) {
            Raven.config(config.raven.dsn, {
                logger: 'javascript-client',
                release: config.version
            }).install();
        }
    }
    logWarning(message, additionalData) {
        let data = {
            level: 'warning', // one of 'info', 'warning', or 'error'
        };

        if (additionalData != null) {
            try {
                data['extra'] = {additionalData: JSON.stringify(additionalData)};
            } catch (e) {
                data['extra'] = {additionalData: 'Failed to serialize'};
            }
        }

        if (Raven.isSetup()) {
            Raven.captureMessage(message, data);
        } else {
            console.warn('Error logging to Sentry is not configured. The error will not be sent: ', message, data);
        }
    }
}

/**
 * @ngdoc service
 * @module superdesk.core.services
 * @name loger
 *
 * @description
 * logger service
 *
 * Sends logs to sentry servers
 */
export default angular.module('superdesk.core.services.logger', [])
    .service('logger', ['config', Logger]);