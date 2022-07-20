import * as React from 'react';
import {convertToRaw} from 'draft-js';
import {
    IAuthoringAutoSave,
    IAuthoringStorage,
    IBaseRestApiResponse,
    IEditor3Config,
    IEditor3ValueStorage,
    IStorageAdapter,
} from 'superdesk-api';
import {Button, Modal, Label, IconLabel} from 'superdesk-ui-framework/react';
import {LANGUAGE} from '../../constants';
import {IRundownItemBase} from '../../interfaces';

import {superdesk} from '../../superdesk';
import {rundownItemContentProfile} from './rundown-items/content-profile';
import {Map} from 'immutable';
import {RUNDOWN_ITEM_TYPES_VOCABULARY_ID, SHOW_PART_VOCABULARY_ID} from '../../constants';
import {IVocabularyItem} from 'superdesk-api';
import {syncDurationWithEndTime} from './sync-duration-with-end-time';
const {vocabulary} = superdesk.entities;

const {gettext} = superdesk.localization;

const {getAuthoringComponent} = superdesk.components;
const {computeEditor3Output, getContentStateFromHtml, arrayMove} = superdesk.helpers;

const rundownTemplateItemStorageAdapter: IStorageAdapter<IRundownItemTemplateInitial> = {
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
    item: IRundownItemTemplateInitial,
    onSave: (item: IRundownItemTemplateInitial) => void,
): IAuthoringStorage<IRundownItemTemplateInitial> {
    class AutoSaveRundownItem implements IAuthoringAutoSave<IRundownItemTemplateInitial> {
        get() {
            return Promise.resolve(item);
        }

        delete() {
            return Promise.resolve();
        }

        schedule(
            getItem: () => IRundownItemTemplateInitial,
            callback: (autosaved: IRundownItemTemplateInitial) => void,
        ) {
            callback(getItem());
        }

        cancel() {
            // noop
        }
    }

    const authoringStorageRundownItem: IAuthoringStorage<IRundownItemTemplateInitial> = {
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

const AuthoringReact = getAuthoringComponent<IRundownItemTemplateInitial>();

interface IProps {
    items: Array<IRundownItemBase>;
    onChange(items: Array<IRundownItemBase>): void;
    readOnly: boolean;
}

interface IRundownItemTemplateInitial extends IBaseRestApiResponse {
    data: Partial<IRundownItemBase>;
}

interface ICreate {
    type: 'create';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

interface IEdit {
    type: 'edit';
    item: IRundownItemTemplateInitial;
    authoringStorage: IAuthoringStorage<IRundownItemTemplateInitial>;
}

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
        const item: IRundownItemTemplateInitial = {
            _id: '',
            _created: '',
            _updated: '',
            _etag: '',
            _links: {},
            data: {},
        };

        const createData: ICreate = {
            type: 'create',
            item: item,
            authoringStorage: getRundownItemTemplateAuthoringStorage(
                item,
                (val) => {
                    this.props.onChange(this.props.items.concat(
                        val.data as IRundownItemBase, // validation is handled by authoring component
                    ));
                },
            ),
        };

        this.setState({
            createOrEdit: createData,
        });
    }

    editItem(data: IRundownItemBase) {
        const item: IRundownItemTemplateInitial = {
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
                    const {show_part, item_type} = val.data;

                    if (show_part != null && item_type != null) {
                        this.props.onChange(
                            this.props.items.map(
                                (_item) => {
                                    return _item === data
                                        ? val.data as IRundownItemBase // validation is handled by authoring component
                                        : _item;
                                },
                            ),
                        );
                    }
                },
            ),
        };

        this.setState({
            createOrEdit: createData,
        });
    }

    reorder(from: number, to: number) {
        this.props.onChange(arrayMove(this.props.items, from, to));
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
                        const showPart = item.show_part == null ? null : showParts.get(item.show_part);
                        const itemType = item.item_type == null ? null : rundownItemTypes.get(item.item_type);

                        return (
                            <div key={i} style={{padding: 4, margin: 4, border: '1px solid blue'}}>
                                {item.title}

                                {
                                    showPart != null && (
                                        <Label
                                            text={showPart.name}
                                            color={showPart.color}
                                        />
                                    )
                                }

                                {
                                    itemType != null && (
                                        <Label
                                            text={itemType.name}
                                            color={itemType.color}
                                        />
                                    )
                                }

                                {
                                    !readOnly && (
                                        <div>
                                            <button
                                                onClick={() => {
                                                    this.reorder(i, i - 1);
                                                }}
                                            >
                                                move up
                                            </button>

                                            <button
                                                onClick={() => {
                                                    this.reorder(i, i + 1);
                                                }}
                                            >
                                                move down
                                            </button>
                                        </div>
                                    )
                                }

                                {
                                    // TODO: show 3 letter show symbol
                                }

                                {
                                    item.planned_duration != null && (
                                        <IconLabel
                                            text={item.planned_duration.toString()}
                                            innerLabel={gettext('Planned duration')}
                                            icon="time"
                                            style="translucent"
                                            size="small"
                                        />
                                    )
                                }

                                {
                                    item.duration != null && (
                                        <IconLabel
                                            text={item.duration.toString()}
                                            innerLabel={gettext('Duration')}
                                            style="translucent"
                                            size="small"
                                            type={(() => {
                                                if (item.planned_duration == null) {
                                                    return 'success';
                                                } else if (item.duration > item.planned_duration) {
                                                    return 'alert';
                                                } else if (item.duration < item.planned_duration) {
                                                    return 'warning';
                                                } else {
                                                    return 'success';
                                                }
                                            })()}
                                        />
                                    )
                                }

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
                                size="large"
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
                                    getInlineToolbarActions={({save}) => {
                                        return {
                                            readOnly: false,
                                            actions: [
                                                {
                                                    label: gettext('Apply'),
                                                    availableOffline: false,
                                                    group: 'end',
                                                    priority: 0.1,
                                                    component: () => (
                                                        <Button
                                                            text={gettext('Apply')}
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
                                    onFieldChange={syncDurationWithEndTime}
                                />
                            </Modal>
                        )
                    }
                </div>
            </div>
        );
    }
}
