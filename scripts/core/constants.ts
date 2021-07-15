import {gettext} from './utils';

// Used for determining whether to update articles list upon receiving a websocket event.
export const ARTICLE_RELATED_RESOURCE_NAMES = [
    'archive',
    'archive_spike',
    'archive_unspike',
];

export const ITEM_TYPES = [
    {type: 'text', label: gettext('text')},
    {type: 'picture', label: gettext('picture')},
    {type: 'graphic', label: gettext('graphic')},
    {type: 'composite', label: gettext('package')},
    {type: 'highlight-pack', label: gettext('highlights package')},
    {type: 'video', label: gettext('video')},
    {type: 'audio', label: gettext('audio')},
];
