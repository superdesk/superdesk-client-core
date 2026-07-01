import {gettext} from 'core/utils';

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

/**
 * Registry of authoring action menu groups.
 *
 * NOTE: This exists primarily for backward compatibility with extensions
 * that still use the deprecated `groupId` string (e.g. `planning-actions`
 * from the superdesk-planning extension). Once all extensions migrate to
 * the `group` attribute on `IAuthoringAction`, this constant should be
 * reviewed and potentially simplified.
 */
export const AUTHORING_MENU_GROUPS: {[groupId: string]: {label?: string; priority: number}} = {
    'general': {priority: 0},
    'planning-actions': {label: gettext('Planning'), priority: 10},
    'highlights': {priority: 20},
    'translations': {label: gettext('Translations'), priority: 30},
    'spellchecker': {label: gettext('Spell Checker'), priority: 40},
};
