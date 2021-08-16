// Used for determining whether to update articles list upon receiving a websocket event.
export const ARTICLE_RELATED_RESOURCE_NAMES = [
    'archive',
    'archive_spike',
    'archive_unspike',
];

export enum IDevTools {
    reduxLogger = 'reduxLogger',
    networkQueueLogger = 'networkQueueLogger',
}

const devtoolsString = localStorage.getItem('devtools');
const devToolsValues = devtoolsString == null ? [] : JSON.parse(devtoolsString);

export const DEV_TOOLS = {
    reduxLoggerEnabled: devToolsValues.includes('redux-logger'),
    networkQueueLoggerEnabled: devToolsValues.includes('network-queue-logger'),
};
