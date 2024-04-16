/* eslint-disable react/no-multi-comp */
import React from 'react';
import {
    IPropsGenericFormItemComponent,
    IPropsGenericFormContainer,
    IContentProfile,
    IContentProfileEditorConfig,
    IVocabulary,
} from 'superdesk-api';

import {gettext} from 'core/utils';
import {IContentProfileType} from '../controllers/ContentProfilesController';
import {assertNever, nameof} from 'core/helpers/typescript-helpers';
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
import {GenericArrayListPageComponent} from 'core/helpers/generic-array-list-page-component';
import {arrayMove} from '@superdesk/common';
import {getTypeForFieldId} from 'apps/workspace/helpers/getTypeForFieldId';

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
        selectedSection: keyof typeof IContentProfileSection;
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
    insertNewItemAtIndex: number | undefined;
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
        const {item, page, index, inEditMode, getId} = this.props.wrapper;
        const {
            sortingInProgress,
            setIndexForNewItem,
            getLabel,
            availableIds,
            selectedSection,
        } = this.props.wrapper.additionalProps;
        const itemLabel = getLabel(item.id);
        const isLast = index === page.getItemsCount() - 1;
        const canAddNewField =
            availableIds.length > 0
            && !sortingInProgress
            && !page.itemIsBeingEdited()
            && !page.itemIsBeingCreated();

        return (
            <div
                className={'sd-list-item sd-shadow--z1' + (inEditMode ? ' sd-list-item--activated' : '')}
                onClick={(e: any) => {
                    if (
                        querySelectorParent(e.target, 'select', {self: true}) == null
                        && querySelectorParent(e.target, 'button', {self: true}) == null
                    ) {
                        page.startEditing(getId(item));
                    }
                }}
            >
                {
                    canAddNewField
                        ? (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%',
                                    position: 'absolute',
                                    insetBlockStart: '-19px',
                                }}
                            >
                                <NewFieldSelect
                                    availableFields={availableIds}
                                    onSelect={(selectedId) => {
                                        setIndexForNewItem(index);
                                        page.openNewItemForm(getNewItemTemplate(selectedId, selectedSection));
                                    }}
                                />
                            </div>
                        )
                        : null
                }

                <div
                    className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border"
                    data-test-id="content-profile-item"
                    data-test-value={itemLabel}
                >
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {itemLabel}
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
                    canAddNewField && isLast
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
                                        page.openNewItemForm(getNewItemTemplate(selectedId, selectedSection));
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
            <div
                className="sd-list-item-group sd-list-item-group--space-between-items sd-padding-x--2 sd-padding-y--3"
                data-test-id="content-profile-items-list"
            >
                {this.props.children}
            </div>
        );
    }
}

function getNewItemTemplate(
    fieldId: string,
    section: keyof typeof IContentProfileSection,
): Partial<IContentProfileField> {
    return {
        id: fieldId,
        section: section,
    };
}

const ItemsContainerBaseSortable = SortableContainer(ItemsContainerBase);

export type IContentProfileFieldWithSystemId = IContentProfileField;

function isFieldEnabled(editor: IContentProfileEditorConfig, field: string) {
    return editor[field]?.enabled ?? false;
}

export class ContentProfileFieldsConfig extends React.Component<IProps, IState> {
    private ItemsContainerComponent: React.ComponentType<IPropsGenericFormContainer<IContentProfileFieldWithSystemId>>;
    private isAllowedForSection: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            fields: null,
            activeTab: getAllContentProfileSections()[0],
            selectedSection: getAllContentProfileSections()[0],
            sortingInProgress: false,
            insertNewItemAtIndex: undefined,
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
                        field[_property] = schema[fieldId]?.[_property];
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
            <div className="sd-nav-tabs" data-test-id="content-profile-tabs">
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
                            aria-label={tab.label}
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
            const {sortingInProgress, selectedSection} = this.state;
            const fields = this.state.fields[this.state.selectedSection];

            const getLabel = (id) => {
                return this.state.editor[id]?.field_name ?? getLabelForFieldId(id, this.state.vocabularies);
            };

            const availableIds: Array<{id: string; label: string; fieldType: string;}> = this.state.allFieldIds
                .filter((id) => {
                    return (
                        this.isAllowedForSection(this.state.selectedSection, id)
                        && !this.existsInFields(id)
                    );
                })
                .map((id) => ({
                    id,
                    label: getLabel(id),
                    fieldType: getTypeForFieldId(id, this.state.vocabularies),
                }))
                .sort((x, y) => x.label.localeCompare(y.label));

            const setIndexForNewItem = (index) => {
                this.setState({insertNewItemAtIndex: index});
            };

            return (
                <div>
                    {tabs}

                    <GenericArrayListPageComponent
                        getFormConfig={(item) => {
                            return getContentProfileFormConfig(
                                this.state.editor,
                                this.state.schema,
                                this.state.customFields,
                                item,
                            );
                        }}
                        defaultSortOption={{field: nameof<IContentProfileField>('field_name'), direction: 'ascending'}}
                        value={fields}
                        onChange={(val) => {
                            this.setState({fields: this.updateCurrentFields(() => val)});
                        }}
                        ItemComponent={ItemComponent}
                        ItemsContainerComponent={this.ItemsContainerComponent}
                        additionalProps={{
                            sortingInProgress,
                            availableIds,
                            setIndexForNewItem,
                            getLabel,
                            selectedSection,
                        }}
                        disallowFiltering
                        disallowSorting
                        disallowCreatingNewItem
                        hideItemsCount
                        contentMargin={0}
                        getNoItemsPlaceholder={(page) => (
                            <div style={{display: 'flex', alignItems: 'center', padding: 10, gap: 20}}>
                                {gettext('There are no items yet.')}
                                <NewFieldSelect
                                    availableFields={availableIds}
                                    onSelect={(selectedId) => {
                                        setIndexForNewItem(0);
                                        page.openNewItemForm(getNewItemTemplate(
                                            selectedId,
                                            this.state.selectedSection,
                                        ));
                                    }}
                                />
                            </div>
                        )}
                        getId={(item) => item.id}
                        hiddenFields={[nameof<IContentProfileField>('id'), nameof<IContentProfileField>('section')]}
                        newItemIndex={this.state.insertNewItemAtIndex}
                    />
                </div>
            );
        }
    }
}
