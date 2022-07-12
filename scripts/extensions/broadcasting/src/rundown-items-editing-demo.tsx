/* eslint-disable react/no-multi-comp */
/* eslint-disable no-case-declarations */

import * as React from 'react';
import {OrderedMap} from 'immutable';
import {Cancelable, throttle} from 'lodash';
import {Button} from 'superdesk-ui-framework/react';
import {
    IAuthoringAutoSave,
    IAuthoringFieldV2,
    IAuthoringStorage,
    IBaseRestApiResponse,
    IContentProfileV2,
    IDropdownConfigVocabulary,
    IEditor3Config,
    RICH_FORMATTING_OPTION,
} from 'superdesk-api';

import {superdesk} from './superdesk';
const {gettext} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;

interface IRundownItem extends IBaseRestApiResponse {
    name: string;
}

const {getAuthoringComponent} = superdesk.components;

const AuthoringReact = getAuthoringComponent<IRundownItem>();

interface IProps {
    itemId: string;
}

const testEntity: IRundownItem = {
    _id: '1',
    name: 'zap',
    _etag: 'z',
    _links: {},
    _created: '',
    _updated: '',
};

export class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItem> {
    autoSaveThrottled: (
        (
            getItem: () => IRundownItem,
            callback: (autosaved: IRundownItem) => void,
        ) => void) & Cancelable;

    constructor(delay: number) {
        this.autoSaveThrottled = throttle(
            (getItem, _callback) => {
                return Promise.resolve(getItem()); // FINISH:
            },
            delay,
            {leading: false},
        );
    }

    get(id: IRundownItem['_id']) {
        return httpRequestJsonLocal<IRundownItem>({
            method: 'GET',
            path: `/archive_autosave/${id}`,
        });
    }

    delete(_id: IRundownItem['_id'], _etag: IRundownItem['_etag']) {
        return Promise.resolve();
    }

    schedule(getItem: () => IRundownItem, callback: (autosaved: IRundownItem) => void) {
        this.autoSaveThrottled(getItem, callback);
    }

    cancel() {
        this.autoSaveThrottled.cancel();
    }
}

const testEditorFormat: Array<RICH_FORMATTING_OPTION> = [
    'uppercase',
    'lowercase',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ordered list',
    'unordered list',
    'quote',
    'link',
    'embed',
    'underline',
    'italic',
    'bold',
    'annotation',
    'comments',
    'pre',
    'superscript',
    'subscript',
    'strikethrough',
];

const editor3TestConfig: IEditor3Config = {
    editorFormat: testEditorFormat,
    minLength: undefined,
    maxLength: undefined,
    cleanPastedHtml: false,
    singleLine: false,
    disallowedCharacters: [],
};

const titleField: IAuthoringFieldV2 = {
    id: 'title',
    name: gettext('Title'),
    fieldType: 'editor3',
    fieldConfig: editor3TestConfig,
};

const contentField: IAuthoringFieldV2 = {
    id: 'content',
    name: gettext('Content'),
    fieldType: 'editor3',
    fieldConfig: editor3TestConfig,
};

const itemTypesConfig: IDropdownConfigVocabulary = {
    source: 'vocabulary',
    vocabularyId: 'rundown-item-types',
    multiple: false,
};

const itemTypeField: IAuthoringFieldV2 = {
    id: 'item_type',
    name: 'Rundown item types', // TODO: use vocabulary name
    fieldType: 'dropdown',
    fieldConfig: itemTypesConfig,
};

const startTimeField: IAuthoringFieldV2 = {
    id: 'start_time',
    name: gettext('Start time'),
    fieldType: 'time',
    fieldConfig: {},
};

const endTimeField: IAuthoringFieldV2 = {
    id: 'end_time',
    name: gettext('End time'),
    fieldType: 'time',
    fieldConfig: {},
};

export const authoringStorageRundownItem: IAuthoringStorage<IRundownItem> = {
    autosave: new AutoSaveRundownItem(3000),
    getEntity: () => {
        return Promise.resolve({saved: testEntity, autosaved: null});
    },
    isLockedInCurrentSession: () => false,
    lock: () => {
        return Promise.resolve(testEntity);
    },
    unlock: () => {
        return Promise.resolve(testEntity);
    },
    saveEntity: () => {
        // console.log('request saving', current);
        return Promise.resolve(testEntity);
    },
    getContentProfile: () => {
        const profile: IContentProfileV2 = {
            id: 'temp-profile',
            name: 'Temporary profile',
            header: OrderedMap([
                [itemTypeField.id, itemTypeField],
                // TODO: Show, 3 letter mark, read-only
                // TODO: Show part - depends on show
                [startTimeField.id, startTimeField],
                [endTimeField.id, endTimeField],
            ]),
            content: OrderedMap([
                [titleField.id, titleField],
                [contentField.id, contentField],
            ]),
        };

        return Promise.resolve(profile);
    },
    closeAuthoring: () => {
        return Promise.resolve();
    },
    getUserPreferences: () => Promise.resolve({'spellchecker:status': {enabled: true}}),
};

export class RundownItemsAuthoring extends React.PureComponent<IProps> {
    render() {
        return (
            <AuthoringReact
                itemId={this.props.itemId}
                onClose={() => {
                    // noop
                }}
                authoringStorage={authoringStorageRundownItem}
                fieldsAdapter={{}}
                storageAdapter={{
                    storeValue: (value, fieldId, rundownItem, _config, _fieldType) => {
                        return {
                            ...rundownItem,
                            [fieldId]: value,
                        };
                    },
                    retrieveStoredValue: (rundownItem, fieldId) =>
                        (rundownItem as {[key: string]: any})[fieldId] ?? null,
                }}
                getLanguage={() => 'en'}
                getActions={() => {
                    return Promise.resolve([
                        {
                            label: 'Say hello',
                            onTrigger: () => {
                                // eslint-disable-next-line no-alert
                                alert('hello');
                            },
                        },
                    ]);
                }}
                getInlineToolbarActions={({save}) => {
                    return {
                        readOnly: false,
                        actions: [
                            {
                                label: gettext('Save'),
                                availableOffline: false,
                                group: 'end',
                                priority: 0.1,
                                component: () => (
                                    <Button
                                        text={gettext('Save')}
                                        onClick={() => {
                                            save();
                                        }}
                                        type="primary"
                                    />
                                ),
                            },
                        ],
                    };
                }}
                getAuthoringTopBarWidgets={() => []}
                topBar2Widgets={[]}
            />
        );
    }
}
