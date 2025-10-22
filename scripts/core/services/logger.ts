class Logger {
    error(
        e: Error,
        additionalData?: any, // has to be serializable to JSON string
    ) {
        console.error(e, additionalData || '');
    }

    warn(
        message: string,
        additionalData?, // has to be serializable to JSON string
    ) {
        console.warn(message, additionalData || '');
    }
}

export const logger = new Logger();

export default angular.module('superdesk.core.services.logger', [])
    .service('logger', [Logger]);
