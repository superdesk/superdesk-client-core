import * as React from 'react';
import {convertToRaw} from 'draft-js';
import {
    IAuthoringAutoSave,
    IAuthoringStorage,
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {Button, Modal, Label, IconLabel} from 'superdesk-ui-framework/react';
import {LANGUAGE} from '../../constants';
import {IRundownItemBase, IRundownItemTemplate} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {rundownItemContentProfile} from './rundown-items/content-profile';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID, SHOW_PART_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
const {vocabulary} = superdesk.entities;

const {gettext} = superdesk.localization;

const {getAuthoringComponent} = superdesk.components;
const {computeEditor3Output, getContentStateFromHtml} = superdesk.helpers;

const rundownTemplateItemStorageAdapter: IStorageAdapter<IRundownItemTemplate> = {
    storeValue: (value, fieldId, rundownItem, config, fieldType) => {
        if (fieldType === 'editor3' && ((config as IEditor3Config).singleLine) === true) {
            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: computeEditor3Output(
                        (value as IEditor3ValueStorage).rawContentState,
                        config as IEditor3Config,
                        LANGUAGE,
                    ).stringValue,
                },
            };
        } else {
            return {
                ...rundownItem,
                data: {
                    ...(rundownItem.data ?? {}),
                    [fieldId]: value,
                },
            };
        }
    },
    retrieveStoredValue: (rundownItem, fieldId, fieldType) => {
        const value = (rundownItem.data as {[key: string]: any})[fieldId] ?? null;

        if (fieldType === 'editor3') {
            const returnValue: IEditor3ValueStorage = typeof value === 'string'
                ? {rawContentState: convertToRaw(getContentStateFromHtml(value))}
                : value;

            return returnValue;
        } else {
            return value;
        }
    },
};

function getRundownItemTemplateAuthoringStorage(
    item: IRundownItemTemplate,
    onSave: (item: IRundownItemTemplate) => void,
): IAuthoringStorage<IRundownItemTemplate> {
    class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItemTemplate> {
        get() {
            return Promise.resolve(item);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(getItem: () => IRundownItemTemplate, callback: (autosaved: IRundownItemTemplate) => void) {
            callback(getItem());
        }

        cancel() {
            // noop
        }
    }

    const authoringStorageRundownItem: IAuthoringStorage<IRundownItemTemplate> = {
        autosave: new AutoSaveRundownItem(),
        getEntity: () => {
            return Promise.resolve({saved: item, autosaved: null});
        },
        isLockedInCurrentSession: () => false,
        lock: () => {
            return Promise.resolve(item);
        },
        unlock: () => {
            return Promise.resolve(item);
        },
        saveEntity: (current) => {
            onSave(current);

            return Promise.resolve(current);
        },
        getContentProfile: () => {
            return Promise.resolve(rundownItemContentProfile);
        },
        closeAuthoring: (_1, _2, _3, doClose) => {
            doClose();
            return Promise.resolve();
        },
        getUserPreferences: () => Promise.resolve({'spellchecker:status': {enabled: true}}), // FINISH: remove test data
    };

    return authoringStorageRundownItem;
}

const AuthoringReact = getAuthoringComponent<IRundownItemTemplate>();

interface IProps {
    items: Array<IRundownItemBase>;
    onChange(items: Array<IRundownItemBase>): void;
    readOnly: boolean;
}

type ICreate = {type: 'create', item: IRundownItemTemplate, authoringStorage: IAuthoringStorage<IRundownItemTemplate>};
type IEdit = {type: 'edit', item: IRundownItemTemplate, authoringStorage: IAuthoringStorage<IRundownItemTemplate>};

interface IState {
    createOrEdit: ICreate | IEdit | null;
}

export class ManageRundownItems extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            createOrEdit: null,
        };

        this.createNewItem = this.createNewItem.bind(this);
        this.editItem = this.editItem.bind(this);
    }

    createNewItem() {
        const item: IRundownItemTemplate = {
            _id: '',
            _created: '',
            _updated: '',
            _etag: '',
            _links: {},
            data: {
                title: '',
                additional_notes: '',
                live_captions: '',
                item_type: '',
                show_part: '',
                duration: 0,
                planned_duration: 0,
            },
        };

        const createData: ICreate = {
            type: 'create',
            item: item,
            authoringStorage: getRundownItemTemplateAuthoringStorage(
                item,
                (val) => {
                    this.props.onChange(this.props.items.concat(val.data));
                },
            ),
        };

        this.setState({
            createOrEdit: createData,
        });
    }

    editItem(data: IRundownItemBase) {
        const item: IRundownItemTemplate = {
            _id: '',
            _created: '',
            _updated: '',
            _etag: '',
            _links: {},
            data,
        };

        const createData: IEdit = {
            type: 'edit',
            item: item,
            authoringStorage: getRundownItemTemplateAuthoringStorage(
                item,
                (val) => {
                    this.props.onChange(
                        this.props.items.map((_item) => _item === data ? val.data : _item),
                    );
                },
            ),
        };

        this.setState({
            createOrEdit: createData,
        });
    }

    render() {
        const {readOnly} = this.props;
        const {createOrEdit} = this.state;

        const showParts = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(SHOW_PART_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        const rundownItemTypes = Map<string, IVocabularyItem>(
            vocabulary.getVocabulary(RUNDOWN_ITEM_TYPES_VOCABULARY_ID).items.map((item) => [item.qcode, item]),
        );

        return (
            <div>
                {
                    this.props.items.map((item, i) => {
                        const showPart = showParts.get(item.show_part);
                        const itemType = rundownItemTypes.get(item.item_type);

                        return (
                            <div key={i} style={{padding: 4, margin: 4, border: '1px solid blue'}}>
                                {item.title}
                                <Label
                                    text={showPart.name}
                                    color={showPart.color}
                                />

                                <Label
                                    text={itemType.name}
                                    color={itemType.color}
                                />

                                {
                                    // TODO: show 3 letter show symbol
                                }

                                <IconLabel
                                    text={item.planned_duration.toString()}
                                    innerLabel={gettext('Planned duration')}
                                    icon="time"
                                    style="translucent"
                                    size="small"
                                />

                                <IconLabel
                                    text={item.duration.toString()}
                                    innerLabel={gettext('Duration')}
                                    // FINISH: check on criteria that should be used for determining background color
                                    style="translucent"
                                    size="small"
                                    type="warning"
                                />

                                {
                                    !readOnly && (
                                        <span onClick={() => this.editItem(item)}>EDIT</span>
                                    )
                                }
                            </div>
                        );
                    })
                }

                {
                    !readOnly && (
                        <div>
                            <Button
                                type="primary"
                                size="small"
                                icon="plus-large"
                                text={gettext('New rundown item template')}
                                shape="round"
                                iconOnly={true}
                                disabled={this.state.createOrEdit != null}
                                onClick={() => {
                                    this.createNewItem();
                                }}
                            />
                        </div>
                    )
                }

                <div>
                    {
                        createOrEdit != null && (
                            <Modal
                                visible
                                onHide={() => {
                                    this.setState({createOrEdit: null});
                                }}
                                zIndex={1051}
                            >
                                <AuthoringReact
                                    itemId=""
                                    onClose={() => {
                                        this.setState({createOrEdit: null});
                                    }}
                                    fieldsAdapter={{}}
                                    authoringStorage={createOrEdit.authoringStorage}
                                    storageAdapter={rundownTemplateItemStorageAdapter}
                                    getLanguage={() => LANGUAGE}
                                    getActions={() => {
                                        return Promise.resolve([
                                            {
                                                label: 'Test action',
                                                onTrigger: () => {
                                                    // eslint-disable-next-line no-alert
                                                    alert('test');
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
                                    getAuthoringTopBarWidgets={() => [
                                        {
                                            group: 'start',
                                            priority: 0.1,
                                            component: () => (
                                                <div style={{border: '1px solid red'}}>
                                                    Show: <strong>ABC</strong>; item position: <strong>3</strong>
                                                </div>
                                            ),
                                            availableOffline: false,
                                        },
                                    ]}
                                    topBar2Widgets={[]}
                                />
                            </Modal>
                        )
                    }
                </div>
            </div>
        );
    }
}
