// Used for determining whether to update articles list upon receiving a websocket event.
export const ARTICLE_RELATED_RESOURCE_NAMES = [
    'archive',
    'archive_spike',
    'archive_unspike',
    'archive_publish',
];

export const SUPERDESK_MEDIA_TYPES = {
    PICTURE: 'application/superdesk.item.picture',
    GRAPHIC: 'application/superdesk.item.graphic',
    VIDEO: 'application/superdesk.item.video',
    EMBED: 'application/superdesk.compatible.embed',
    AUDIO: 'application/superdesk.item.audio',
    EMBED: 'application/superdesk.compatible.embed',
};

export const MEDIA_TYPES_TRIGGER_DROP_ZONE = Object.values(SUPERDESK_MEDIA_TYPES);

export const AUTOSAVE_TIMEOUT = 3000;

export const AUTHORING_FIELD_PREFERENCES = 'authoring:field_preferences';

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
