/* eslint-disable react/no-multi-comp */
import React from 'react';
import {
    ICrudManager,
    ICrudManagerResponse,
    IItemWithId,
    IPropsGenericFormItemComponent,
    IPropsGenericFormContainer,
    IContentProfile,
    IContentProfileEditorConfig,
    IVocabulary,
} from 'superdesk-api';

import {gettext, arrayInsert, arrayMove} from 'core/utils';
import {IContentProfileType} from '../controllers/ContentProfilesController';
import {assertNever} from 'core/helpers/typescript-helpers';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import {IconButton} from 'superdesk-ui-framework/react';
import {groupBy} from 'lodash';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import ng from 'core/services/ng';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {getContentProfileFormConfig} from './get-content-profiles-form-config';
import {getEditorConfig} from './get-editor-config';
import {WidgetsConfig} from './WidgetsConfig';
import {NewFieldSelect} from './new-field-select';

// should be stored in schema rather than editor section of the content profile
// but the fields should be editable via GUI
enum ISchemaFields {
    readonly = 'readonly',
    required = 'required',
    minlength = 'minlength',
    maxlength = 'maxlength',
}

const allSchemaFieldKeys: Array<keyof typeof ISchemaFields> =
    Object.keys(ISchemaFields).map((key) => ISchemaFields[key]);

function isSchemaKey(x: string): x is keyof typeof ISchemaFields {
    return ISchemaFields[x] != null;
}

type ISchemaKey = keyof typeof ISchemaFields;

// this is UI specific data structure
// when saving, data from it will be converted and written to schema/editor sections of the content profile
type IContentProfileField = valueof<IContentProfileEditorConfig> & {id: string} & {[key in ISchemaKey]?: any};

interface IAdditionalProps {
    additionalProps: {
        sortingInProgress: boolean;
        setIndexForNewItem(index: number): void;
        getLabel(id: string): string;
        availableIds: Array<{id: string; label: string}>;
    };
}

interface IProps {
    profile: IContentProfile;
    profileType: keyof typeof IContentProfileType;
    patchContentProfile(patch: Partial<IContentProfile>): void;
}

interface IState {
    fields: {[key in IContentProfileSection]: Array<IContentProfileField>} | null;
    allFieldIds: Array<string> | null;
    selectedSection: keyof typeof IContentProfileSection;
    activeTab: IState['selectedSection'] | 'widgets';
    sortingInProgress: boolean;
    insertNewItemAtIndex: number | null;
    vocabularies: Array<IVocabulary>;
    editor: IContentProfileEditorConfig | null;
    schema: any | null;
    customFields: any | null;
    loading: boolean;
}

enum IContentProfileSection {
    header = 'header',
    content = 'content',
}

function getAllContentProfileSections(): Array<IContentProfileSection> {
    return Object.keys(IContentProfileSection).map((key) => IContentProfileSection[key]);
}

function getTabs(): Array<{label: string, value: IState['activeTab']}> {
    return [
        ...getAllContentProfileSections().map((section) => ({
            label: getLabelForSection(section),
            value: section,
        })),
        {label: gettext('Widgets'), value: 'widgets'},
    ];
}

function getLabelForSection(section: IContentProfileSection) {
    if (section === IContentProfileSection.header) {
        return gettext('Header fields');
    } else if (section === IContentProfileSection.content) {
        return gettext('Content fields');
    } else {
        return assertNever(section);
    }
}

type IPropsItem = IPropsGenericFormItemComponent<IContentProfileFieldWithSystemId> & IAdditionalProps;

// wrapper is used because sortable HOC considers `index` to be its internal prop and doesn't forward it
class ItemBase extends React.PureComponent<{wrapper: IPropsItem}> {
    render() {
        const {item, page, index, inEditMode} = this.props.wrapper;
        const {sortingInProgress, setIndexForNewItem, getLabel, availableIds} = this.props.wrapper.additionalProps;
        const isLast = index === page.getItemsCount() - 1;

        return (
            <div
                className={'sd-list-item sd-shadow--z1' + (inEditMode ? ' sd-list-item--activated' : '')}
                onClick={(e: any) => {
                    if (
                        querySelectorParent(e.target, 'select', {self: true}) == null
                        && querySelectorParent(e.target, 'button', {self: true}) == null
                    ) {
                        page.startEditing(item._id);
                    }
                }}
            >
                {
                    !sortingInProgress
                        ? (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%',
                                    position: 'absolute',
                                    top: '-19px',
                                }}
                            >
                                <NewFieldSelect
                                    availableFields={availableIds}
                                    onSelect={(selectedId) => {
                                        setIndexForNewItem(index);
                                        page.openNewItemForm({_id: selectedId});
                                    }}
                                />
                            </div>
                        )
                        : null
                }

                <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border">
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {getLabel(item.id)}
                    </span>
                </div>

                {
                    item.required === true ? (
                        <div className="sd-list-item__column sd-list-item__column--no-border">
                            <span className="label label--alert label--hollow">{gettext('required')}</span>
                        </div>
                    ) : null
                }

                <div className="sd-list-item__action-menu">
                    <IconButton icon="trash" ariaValue={gettext('Delete')} onClick={() => page.deleteItem(item)} />
                </div>

                {
                    !sortingInProgress && isLast
                        ? (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%',
                                    position: 'absolute',
                                    bottom: '-17px',
                                }}
                            >
                                <NewFieldSelect
                                    availableFields={availableIds}
                                    onSelect={(selectedId) => {
                                        setIndexForNewItem(index + 1);
                                        page.openNewItemForm({_id: selectedId});
                                    }}
                                />
                            </div>
                        )
                        : null
                }
            </div>
        );
    }
}

const ItemBaseSortable = SortableElement(ItemBase);

class ItemComponent extends React.PureComponent<IPropsItem> {
    render() {
        return (
            <ItemBaseSortable
                wrapper={this.props}
                index={this.props.index}
            />
        );
    }
}

class ItemsContainerBase extends React.PureComponent {
    render() {
        return (
            <div className="sd-list-item-group sd-list-item-group--space-between-items sd-padding-x--2 sd-padding-y--3">
                {this.props.children}
            </div>
        );
    }
}

const ItemsContainerBaseSortable = SortableContainer(ItemsContainerBase);

export type IContentProfileFieldWithSystemId = IContentProfileField & IItemWithId;

function stripSystemId(item: IContentProfileFieldWithSystemId): IContentProfileField {
    const copy = {...item};

    delete copy['_id'];

    return copy;
}

function isFieldEnabled(editor: IContentProfileEditorConfig, field: string) {
    return editor[field]?.enabled ?? false;
}

export class Heelo extends React.Component<IProps, IState> {
    render() {
        return (<div>woo</div>);
    }
}

export class ContentProfileFieldsConfig extends React.Component<IProps, IState> {
    private generateKey: () => string;
    private lastKey: number;
    private ItemsContainerComponent: React.ComponentType<IPropsGenericFormContainer<IContentProfileFieldWithSystemId>>;
    private isAllowedForSection: any;

    constructor(props: IProps) {
        super(props);

        this.lastKey = 0;
        this.generateKey = () => (++this.lastKey).toString();

        this.state = {
            fields: null,
            activeTab: getAllContentProfileSections()[0],
            selectedSection: getAllContentProfileSections()[0],
            sortingInProgress: false,
            insertNewItemAtIndex: null,
            editor: null,
            schema: null,
            vocabularies: [],
            allFieldIds: null,
            customFields: null,
            loading: true,
        };

        const onSortEnd = ({oldIndex, newIndex}) => {
            this.setState({
                sortingInProgress: false,
                fields: this.updateCurrentFields((_fields) => arrayMove(_fields, oldIndex, newIndex)),
            });
        };

        const beforeSortStart = () => {
            this.setState({sortingInProgress: true});
        };

        class ItemsContainerComponent
            extends React.PureComponent<IPropsGenericFormContainer<IContentProfileFieldWithSystemId>> {
            render() {
                return (
                    <ItemsContainerBaseSortable
                        onSortEnd={onSortEnd}
                        updateBeforeSortStart={beforeSortStart}
                        distance={10}
                    >
                        {this.props.children}
                    </ItemsContainerBaseSortable>
                );
            }
        }

        this.ItemsContainerComponent = ItemsContainerComponent;

        this.updateCurrentFields = this.updateCurrentFields.bind(this);
        this.existsInFields = this.existsInFields.bind(this);
    }

    /** Checks in all sections */
    existsInFields(id: string) {
        return getAllContentProfileSections()
            .some((section) => this.state.fields[section].some((item) => item.id === id));
    }

    updateCurrentFields(
        fn: (items: Array<IContentProfileField>) => Array<IContentProfileField>,
    ): IState['fields'] {
        return {
            ...this.state.fields,
            [this.state.selectedSection]: fn(this.state.fields[this.state.selectedSection]),
        };
    }

    componentDidMount() {
        const vocabularies = ng.get('vocabularies');
        const content = ng.get('content');

        Promise.all([
            vocabularies.getVocabularies(),
            getEditorConfig(this.props.profile._id),
            content.getCustomFields(),
        ]).then((res) => {
            const [vocabulariesCollection, {editor, schema, isAllowedForSection}, customFields] = res;

            this.isAllowedForSection = isAllowedForSection;

            const getOrder = (field) => editor[field]?.order ?? 99;

            const allFieldIds = Object.keys(editor);

            const fields: Array<IContentProfileField> = allFieldIds
                .filter((fieldId) => isFieldEnabled(editor, fieldId))
                .sort((a, b) => getOrder(a) - getOrder(b))
                .map((fieldId) => {
                    const editorField = editor[fieldId];

                    let field: IContentProfileField = {
                        ...editorField,
                        id: fieldId,
                    };

                    allSchemaFieldKeys.forEach((_property) => {
                        field[_property] = schema[fieldId][_property];
                    });

                    return field;
                });

            var grouped = groupBy(fields, (item) => item.section);

            this.setState({
                editor,
                schema,
                fields: {
                    header: grouped[IContentProfileSection.header] ?? [],
                    content: grouped[IContentProfileSection.content] ?? [],
                },
                vocabularies: vocabulariesCollection,
                allFieldIds,
                customFields,
                loading: false,
            });
        });
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (prevState.fields != null && prevState.fields !== this.state.fields) {
            const editorCopy = {...this.state.editor};
            const schemaCopy = {...this.state.schema};

            const fieldsFlat = getAllContentProfileSections()
                .reduce<Array<IContentProfileField>>(
                    (acc, sectionId) => [...acc, ...this.state.fields[sectionId]],
                    [],
                );

            const patch
            : {[key: string]: {editor: Partial<IContentProfileEditorConfig>, schema: {}}}
            = fieldsFlat.reduce((acc, field, index) => {
                let schemaPatch = {};
                let editorPatch: Partial<IContentProfileEditorConfig[0]> = {};

                acc[field.id] = {
                    editorPatch: {},
                    schemaPatch: {},
                };

                Object.keys(field).forEach((_property) => {
                    if (_property === 'id') {
                        return;
                    }

                    if (isSchemaKey(_property)) {
                        schemaPatch[_property] = field[_property];

                        if (_property === 'readonly' || _property === 'required') {
                            editorPatch[_property] = field[_property];
                        }
                    } else {
                        editorPatch[_property] = field[_property];

                        if (_property === 'minlength' || _property === 'maxlenght') {
                            schemaPatch[_property] = field[_property];
                        }
                    }
                });

                editorPatch.order = index;

                acc[field.id] = {
                    editor: editorPatch,
                    schema: schemaPatch,
                };

                return acc;
            }, {});

            Object.keys(editorCopy).forEach((key) => {
                editorCopy[key] = Object.assign(
                    {},
                    editorCopy[key],
                    patch[key]?.editor ?? {},
                    {order: patch[key]?.editor?.order ?? null, enabled: patch[key] != null},
                );

                schemaCopy[key] = Object.assign(
                    {},
                    schemaCopy[key],
                    patch[key]?.schema ?? {},
                );
            });

            this.props.patchContentProfile({
                editor: editorCopy,
                schema: schemaCopy,
            });
        }
    }

    render() {
        if (this.state.loading) {
            return null;
        }

        const tabs = (
            <div className="sd-nav-tabs">
                {
                    getTabs().map((tab) => (
                        <button
                            className={'sd-nav-tabs__tab ' +
                                (this.state.activeTab === tab.value ? 'sd-nav-tabs__tab--active' : '')}
                            role="tab"
                            key={tab.value}
                            onClick={() => {
                                if (tab.value === 'widgets') {
                                    this.setState({
                                        activeTab: tab.value,
                                    });
                                } else {
                                    this.setState({
                                        selectedSection: tab.value,
                                        activeTab: tab.value,
                                    });
                                }
                            }}
                            aria-selected={this.state.activeTab === tab.value}
                        >{tab.label}</button>
                    ))
                }
            </div>
        );

        if (this.state.activeTab === 'widgets') {
            return (
                <React.Fragment>
                    {tabs}

                    <div className="sd-padding-x--2 sd-padding-b--2">
                        <WidgetsConfig
                            initialWidgetsConfig={this.props.profile.widgets_config}
                            onUpdate={(widgets_config) => {
                                this.props.patchContentProfile({
                                    widgets_config,
                                });
                            }}
                        />
                    </div>
                </React.Fragment>
            );
        } else {
            const {sortingInProgress} = this.state;
            const fields = this.state.fields[this.state.selectedSection];

            const fieldsResponse: ICrudManagerResponse<IContentProfileFieldWithSystemId> = {
                _items: fields.map((field) => ({...field, _id: field.id})),
                _meta: {total: fields.length, page: 1, max_results: fields.length},
            };

            const crudManagerForContentProfileFields: ICrudManager<IContentProfileFieldWithSystemId> = {
                activeFilters: {},
                read: () => Promise.resolve(fieldsResponse),
                update: (item) => {
                    const itemWithId = {...item, id: item._id};

                    return new Promise((resolve) => {
                        this.setState(
                            {
                                fields: this.updateCurrentFields(
                                    (_fields) => {
                                        return _fields.map((field) => {
                                            if (field.id === itemWithId._id) {
                                                return stripSystemId(itemWithId);
                                            } else {
                                                return field;
                                            }
                                        });
                                    },
                                ),
                            },
                            () => {
                                resolve(item);
                            },
                        );
                    });
                },
                create: (item) => {
                    if (item._id == null) {
                        throw new Error('id must be provided');
                    }

                    return new Promise((resolve) => {
                        const itemWithId: IContentProfileFieldWithSystemId = {
                            ...item,
                            _id: item._id,
                            id: item._id,
                            section: this.state.selectedSection,
                        };

                        this.setState(
                            {
                                insertNewItemAtIndex: null,
                                fields: this.updateCurrentFields(
                                    (_fields) => {
                                        return arrayInsert(
                                            _fields,
                                            stripSystemId(itemWithId),
                                            this.state.insertNewItemAtIndex ?? 0,
                                        );
                                    },
                                ),
                            },
                            () => {
                                resolve(itemWithId);
                            },
                        );
                    });
                },
                delete: (item) => {
                    return new Promise((resolve) => {
                        this.setState(
                            {
                                fields: this.updateCurrentFields(
                                    (_fields) => _fields.filter(
                                        (field) => field.id !== item._id,
                                    ),
                                ),
                            },
                            () => {
                                resolve();
                            },
                        );
                    });
                },
                refresh: () => Promise.resolve(fieldsResponse),
                sort: () => Promise.resolve(fieldsResponse),
                removeFilter: () => Promise.resolve(fieldsResponse),
                goToPage: () => Promise.resolve(fieldsResponse),
                _items: fieldsResponse._items,
                _meta: fieldsResponse._meta,
            };

            const getLabel = (id) => {
                return this.state.editor[id]?.field_name ?? getLabelForFieldId(id, this.state.vocabularies);
            };

            const availableIds: Array<{id: string; label: string}> = this.state.allFieldIds
                .filter((id) => {
                    return (
                        this.isAllowedForSection(this.state.selectedSection, id)
                        && !this.existsInFields(id)
                    );
                })
                .map((id) => ({id, label: getLabel(id)}));

            const setIndexForNewItem = (index) => {
                this.setState({insertNewItemAtIndex: index});
            };

            return (
                <div>
                    {tabs}

                    <GenericListPageComponent
                        getFormConfig={(item?) => {
                            return getContentProfileFormConfig(
                                this.state.editor,
                                this.state.schema,
                                this.state.customFields,
                                item,
                            );
                        }}
                        ItemComponent={ItemComponent}
                        ItemsContainerComponent={this.ItemsContainerComponent}
                        items={crudManagerForContentProfileFields}
                        additionalProps={{
                            sortingInProgress,
                            availableIds,
                            setIndexForNewItem,
                            getLabel,
                        }}
                        disallowFiltering
                        disallowCreatingNewItem
                        contentMargin={0}
                        getNoItemsPlaceholder={(page) => (
                            <div style={{display: 'flex', alignItems: 'center', padding: 10, gap: 20}}>
                                {gettext('There are no items yet.')}
                                <NewFieldSelect
                                    availableFields={availableIds}
                                    onSelect={(selectedId) => {
                                        setIndexForNewItem(0);
                                        page.openNewItemForm({_id: selectedId});
                                    }}
                                />
                            </div>
                        )}
                    />
                </div>
            );
        }
    }
}
