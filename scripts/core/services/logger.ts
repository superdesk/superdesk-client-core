import Raven, {RavenOptions} from 'raven-js';

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

    error(
        e: Error,
        additionalData?: any, // has to be serializable to JSON string
    ) {
        console.error(e);

        const options: RavenOptions = {};

        if (additionalData != null) {
            try {
                options.extra = {additionalData: JSON.stringify(additionalData)};
            } catch (e) {
                options.extra = {additionalData: 'Failed to serialize'};
            }
        }

        Raven.captureException(e, options);
    }

    warn(
        message: string,
        additionalData?, // has to be serializable to JSON string
    ) {
        const options: RavenOptions = {};

        options['level'] = 'warning';

        if (additionalData != null) {
            try {
                options.extra = {additionalData: JSON.stringify(additionalData)};
            } catch (e) {
                options.extra = {additionalData: 'Failed to serialize'};
            }
        }

        console.warn(message, options);

        if (Raven.isSetup()) {
            Raven.captureMessage(message, options);
        }
    }
}

export const logger = new Logger();

export default angular.module('superdesk.core.services.logger', [])
    .service('logger', [Logger]);
