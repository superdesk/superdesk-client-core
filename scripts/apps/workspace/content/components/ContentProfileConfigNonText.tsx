/* eslint-disable react/no-multi-comp */
import React from 'react';
import {
    IArrayKeyed,
    ICrudManager,
    ICrudManagerResponse,
    IItemWithId,
    IPropsGenericFormItemComponent,
    IPropsGenericFormContainer,
    IContentProfile,
    IContentProfileEditorConfig,
    IVocabulary,
} from 'superdesk-api';

import {gettext, arrayInsert} from 'core/utils';
import {IContentProfileTypeNonText} from '../controllers/ContentProfilesController';
import {assertNever, Writeable} from 'core/helpers/typescript-helpers';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import arrayMove from 'array-move';
import {Button} from 'superdesk-ui-framework';
import {groupBy} from 'lodash';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import ng from 'core/services/ng';
import {getLabelForFieldId} from 'apps/workspace/helpers/getLabelForFieldId';
import {getContentProfileFormConfig} from './get-content-profiles-form-config';
import {getEditorConfig} from './get-editor-config';

// should be stored in schema rather than editor section of the content profile
// but the fields should be editable via GUI
enum ISchemaFields {
    readonly = 'readonly',
    required = 'required',
    minlength = 'minlength',
    maxlength = 'maxlength',
}

type ISchemaKey = keyof typeof ISchemaFields;

function getAllSchemaKeys(): Array<ISchemaFields> {
    return Object.keys(ISchemaFields).map((key) => ISchemaFields[key]);
}

// this is UI specific data structure
// when saving, data from it will be converted and written to schema/editor sections of the content profile
type IContentProfileField = valueof<IContentProfileEditorConfig> & {id: string} & {[key in ISchemaKey]?: any};

interface IAdditionalProps {
    additionalProps: {
        sortingInProgress: boolean;
        setIndexForNewItem(index: number): void;
        getLabel(id: string): string;
    };
}

interface IProps {
    profile: IContentProfile;
    profileType: keyof typeof IContentProfileTypeNonText;
}

interface IState {
    fields: {[key in IContentProfileSection]: IArrayKeyed<IContentProfileField>} | null;
    allFieldIds: Array<string> | null;
    activeTab: keyof typeof IContentProfileSection;
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

function getLabelForSection(section: IContentProfileSection) {
    if (section === IContentProfileSection.header) {
        return gettext('Header');
    } else if (section === IContentProfileSection.content) {
        return gettext('Content');
    } else {
        return assertNever(section);
    }
}

type IPropsItem = IPropsGenericFormItemComponent<IContentProfileFieldWithSystemId> & IAdditionalProps;

// wrapper is used because sortable HOC considers `index` to be its internal prop and doesn't forward it
class ItemBase extends React.PureComponent<{wrapper: IPropsItem}> {
    render() {
        const {item, page, index} = this.props.wrapper;
        const {sortingInProgress, setIndexForNewItem, getLabel} = this.props.wrapper.additionalProps;
        const isLast = index === page.getItemsCount() - 1;

        return (
            <div
                style={{
                    position: 'relative',

                    // a clone of the element gets appended to the body when sorting is in progress
                    // in order to be visible, it has to have a higher zIndex than the modal
                    zIndex: 1051,

                    border: '1px solid blue',
                    marginTop: 10,
                    marginBottom: 10,
                    cursor: 'pointer',
                }}
                onClick={(e: any) => {
                    if (querySelectorParent(e.target, 'button', {self: true}) == null) {
                        page.startEditing(item._id);
                    }
                }}
            >
                {
                    !sortingInProgress
                        ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                                position: 'absolute',
                                top: '-13px',
                            }}>
                                <button
                                    onClick={() => {
                                        setIndexForNewItem(index);
                                        page.openNewItemForm();
                                    }}
                                >
                                    add
                                </button>
                            </div>
                        )
                        : null
                }

                {getLabel(item.id)}
                <button onClick={() => page.deleteItem(item)}>{gettext('Delete')}</button>

                {
                    item.required === true ? (<strong>{gettext('required')}</strong>) : null
                }

                {
                    !sortingInProgress && isLast
                        ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                                position: 'absolute',
                                bottom: '-13px',
                            }}>
                                <button
                                    onClick={() => {
                                        setIndexForNewItem(index + 1);
                                        page.openNewItemForm();
                                    }}
                                >
                                    add
                                </button>
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
            <div style={{background: 'beige', marginLeft: -20, marginRight: -20}}>
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

export class ContentProfileConfigNonText extends React.Component<IProps, IState> {
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
            .some((section) => this.state.fields[section].some((item) => item.value.id === id));
    }

    updateCurrentFields(
        fn: (items: IArrayKeyed<IContentProfileField>) => IArrayKeyed<IContentProfileField>,
    ): IState['fields'] {
        return {
            ...this.state.fields,
            [this.state.activeTab]: fn(this.state.fields[this.state.activeTab]),
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

                    getAllSchemaKeys().forEach((_property) => {
                        field[_property] = schema[fieldId][_property];
                    });

                    return field;
                });

            // adding keys to items because they will be reordered
            // and they don't have static IDs to be used as react keys
            const fieldsKeyed = fields.map(
                (field) => ({key: this.generateKey(), value: field}),
            );

            var grouped = groupBy(fieldsKeyed, (item) => item.value.section);

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

    componentDidUpdate() {
        // TODO: output to editor/schema sections of the content profile

        // const initialArray: Array<IContentProfileField> = [];

        // this.props.profile.fields = getAllContentProfileSections()
        //     .reduce<Array<IContentProfileField>>(
        //         (acc, key) => [...acc, ...this.state.fields[key].map(({value}) => value)],
        //         initialArray,
        //     );
    }

    render() {
        if (this.state.loading) {
            return null;
        }

        const {activeTab, sortingInProgress} = this.state;
        const fields = this.state.fields[this.state.activeTab];

        const fieldsResponse: ICrudManagerResponse<IContentProfileFieldWithSystemId> = {
            _items: fields.map(({key, value}) => ({...value, _id: key})),
            _meta: {total: fields.length, page: 1, max_results: fields.length},
        };

        const crudManagerForContentProfileFields: ICrudManager<IContentProfileFieldWithSystemId> = {
            activeFilters: {},
            read: () => Promise.resolve(fieldsResponse),
            update: (item) => {
                return new Promise((resolve) => {
                    this.setState(
                        {
                            fields: this.updateCurrentFields(
                                (_fields) => {
                                    return _fields.map((field) => {
                                        if (field.key === item._id) {
                                            return {...field, value: stripSystemId(item)};
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
                return new Promise((resolve) => {
                    const itemWithId: IContentProfileFieldWithSystemId = {
                        ...item,
                        _id: this.generateKey(),
                    };

                    this.setState(
                        {
                            insertNewItemAtIndex: null,
                            fields: this.updateCurrentFields(
                                (_fields) => {
                                    const nextItem = {
                                        key: this.generateKey(),
                                        value: item,
                                    };

                                    return arrayInsert(
                                        _fields,
                                        nextItem,
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
                                    ({key}) => key !== item._id,
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

        return (
            <div>
                {
                    getAllContentProfileSections().map((section) => {
                        return (
                            <Button
                                key={section}
                                text={getLabelForSection(section)}
                                onClick={() => {
                                    this.setState({activeTab: section});
                                }}
                                type={activeTab === section ? 'primary' : 'default'}
                            />
                        );
                    })
                }

                <GenericListPageComponent
                    getFormConfig={(item?) => {
                        const availableIds: Array<{id: string; label: string}> = this.state.allFieldIds
                            .filter((id) => {
                                const isCurrentlySelected = id === item?.id;

                                return (
                                    this.isAllowedForSection(this.state.activeTab, id)
                                    && !this.existsInFields(id)
                                ) || isCurrentlySelected;
                            })
                            .map((id) => ({id, label: getLabel(id)}));

                        return getContentProfileFormConfig(
                            this.state.editor,
                            this.state.schema,
                            availableIds,
                            this.state.customFields,
                            item,
                        );
                    }}
                    ItemComponent={ItemComponent}
                    ItemsContainerComponent={this.ItemsContainerComponent}
                    items={crudManagerForContentProfileFields}
                    additionalProps={{
                        sortingInProgress,
                        setIndexForNewItem: (index) => {
                            this.setState({insertNewItemAtIndex: index});
                        },
                        getLabel,
                    }}
                    disallowFiltering
                    disallowCreatingNewItem
                />
            </div>
        );
    }
}
