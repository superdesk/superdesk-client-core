var Raven = require('raven-js');

class Logger {
    constructor() {
        /* globals __SUPERDESK_CONFIG__: true */
        const appConfig = __SUPERDESK_CONFIG__;

        if (appConfig.raven && appConfig.raven.dsn.length > 0) {
            Raven.config(appConfig.raven.dsn, {
                logger: 'javascript-client',
                release: appConfig.version,
            }).install();
        }
    }
    warn(message, additionalData) {
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

        console.warn(message, data);

        if (Raven.isSetup()) {
            Raven.captureMessage(message, data);
        }
    }
}

export const logger = new Logger();
