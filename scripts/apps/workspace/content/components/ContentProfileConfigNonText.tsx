/* eslint-disable react/no-multi-comp */
import React from 'react';
import {
    IContentProfileNonText,
    IFormGroup,
    IFormField,
    IContentProfileField,
    IArrayKeyed,
    ICrudManager,
    ICrudManagerResponse,
    IItemWithId,
    IPropsGenericFormItemComponent,
    IFormGroupCollapsible,
} from 'superdesk-api';

import {gettext} from 'core/utils';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {IContentProfileTypeNonText} from '../controllers/ContentProfilesController';
import {assertNever} from 'core/helpers/typescript-helpers';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import arrayMove from 'array-move';
import {Button} from 'superdesk-ui-framework';
import {groupBy} from 'lodash';

interface IProps {
    profile: IContentProfileNonText;
    profileType: keyof typeof IContentProfileTypeNonText;
}

interface IState {
    fields: {[key in IContentProfileSection]: IArrayKeyed<IContentProfileField>};
    activeTab: keyof typeof IContentProfileSection;
}

// subset of FormFieldType
enum IContentProfileFieldTypes {
    textSingleLine = 'textSingleLine',
    number = 'number',
}

enum IContentProfileSection {
    header = 'header',
    content = 'content',
}

function getAllContentProfileFieldTypes(): Array<IContentProfileFieldTypes> {
    return Object.keys(IContentProfileFieldTypes).map((key) => IContentProfileFieldTypes[key]);
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

function getCommonContentProfileConfig(
    field: Partial<IContentProfileFieldWithSystemId> | undefined,
): Array<IFormField | IFormGroup> {
    const idField: IFormField = {
        label: gettext('ID'),
        type: FormFieldType.textSingleLine,
        field: 'id',
        required: true,
    };

    const labelField: IFormField = {
        label: gettext('Label'),
        type: FormFieldType.textSingleLine,
        field: 'label',
        required: true,
    };

    const sectionField: IFormField = {
        label: gettext('Section'),
        type: FormFieldType.select,
        component_parameters: {
            items: getAllContentProfileSections()
                .map((section) => ({id: section, label: getLabelForSection(section)})),
        },
        field: 'section',
        required: true,
    };

    const sdWidth: IFormField = {
        label: gettext('Width'),
        type: FormFieldType.select,
        component_parameters: {
            items: [
                {id: 'full', label: gettext('Full')},
                {id: 'half', label: gettext('Half')},
                {id: 'quarter', label: gettext('Quarter')},
            ],
        },
        field: 'sdWidth',
        required: true,
    };

    const fieldType: IFormField = {
        label: gettext('Field type'),
        type: FormFieldType.select,
        component_parameters: {
            items: getAllContentProfileFieldTypes().map((type) => {
                switch (type) {
                case IContentProfileFieldTypes.textSingleLine:
                    return {
                        id: IContentProfileFieldTypes.textSingleLine,
                        label: gettext('Plain text (single line)'),
                    };
                case IContentProfileFieldTypes.number:
                    return {
                        id: IContentProfileFieldTypes.number,
                        label: gettext('Number'),
                    };
                default:
                    return assertNever(type);
                }
            }),
        },
        field: 'type',
        required: true,
    };

    const requiredField: IFormField = {
        label: gettext('Required'),
        type: FormFieldType.checkbox,
        field: 'required',
        required: false,
    };

    const fieldTypeGroup: IFormGroup = {
        type: 'inline',
        direction: 'vertical',
        form: [
            fieldType,
        ],
    };

    const fieldOptionsGroupType: IFormGroupCollapsible = {label: gettext('Field options'), openByDefault: true};

    const fieldOptions = field?.type == null
        ? []
        : getAttributesForFormFieldType(IContentProfileFieldTypes[field.type]);

    if (fieldOptions.length > 0) {
        const optionsGroup: IFormGroup = {
            type: fieldOptionsGroupType,
            direction: 'vertical',
            form: fieldOptions,
        };

        fieldTypeGroup.form.push(optionsGroup);
    }

    return [
        idField,
        labelField,
        sectionField,
        sdWidth,
        fieldTypeGroup,
        requiredField,
    ];
}

function getImageFormConfig(field: Partial<IContentProfileFieldWithSystemId> | undefined): IFormGroup {
    const displayInMediaEditor: IFormField = {
        label: gettext('Display in media editor'),
        type: FormFieldType.checkbox,
        field: 'displayOnMediaEditor',
        required: false,
    };

    const formConfig: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: [...getCommonContentProfileConfig(field), displayInMediaEditor],
    };

    return formConfig;
}

function getVideoFormConfig(field: Partial<IContentProfileFieldWithSystemId>): IFormGroup {
    const formConfig: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: [...getCommonContentProfileConfig(field)],
    };

    return formConfig;
}

function getFormConfig(
    type: IContentProfileTypeNonText,
    field: Partial<IContentProfileFieldWithSystemId> | undefined,
): IFormGroup {
    switch (type) {
    case IContentProfileTypeNonText.image:
        return getImageFormConfig(field);
    case IContentProfileTypeNonText.video:
        return getVideoFormConfig(field);
    default:
        return assertNever(type);
    }
}

function getAttributesForTextSingleLine(): Array<IFormField> {
    const minLengthField: IFormField = {
        label: gettext('Minimum length'),
        type: FormFieldType.number,
        field: 'minlength',
        required: false,
    };

    const maxLengthField: IFormField = {
        label: gettext('Maximum length'),
        type: FormFieldType.number,
        field: 'maxlength',
        required: false,
    };

    return [minLengthField, maxLengthField];
}

function getAttributesForFormFieldType(type: IContentProfileFieldTypes): Array<IFormField> {
    switch (type) {
    case IContentProfileFieldTypes.textSingleLine:
        return getAttributesForTextSingleLine();
    case IContentProfileFieldTypes.number:
        return [];
    default:
        assertNever(type);
    }
}

class ItemBase extends React.PureComponent<IPropsGenericFormItemComponent<IContentProfileFieldWithSystemId>> {
    render() {
        const {item, page} = this.props;

        return (
            <div style={{border: '1px solid blue', marginTop: 10, marginBottom: 10, zIndex: 1051}}>
                {item.label}
                <button onClick={() => page.startEditing(item._id)}>{gettext('Edit')}</button>
                <button onClick={() => page.deleteItem(item)}>{gettext('Delete')}</button>
                {
                    item.required === true ? (<strong>{gettext('required')}</strong>) : null
                }
            </div>
        );
    }
}

const ItemBaseSortable = SortableElement(ItemBase);

class ItemComponent extends React.PureComponent<IPropsGenericFormItemComponent<IContentProfileFieldWithSystemId>> {
    render() {
        const {item, page, index} = this.props;

        return (
            <ItemBaseSortable
                item={item}
                page={page}
                index={index}
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

type IContentProfileFieldWithSystemId = IContentProfileField & IItemWithId;

function stripSystemId(item: IContentProfileFieldWithSystemId): IContentProfileField {
    const copy = {...item};

    delete copy['_id'];

    return copy;
}

export class ContentProfileConfigNonText extends React.Component<IProps, IState> {
    private generateKey: () => string;
    private lastKey: number;
    private ItemsContainerComponent: React.ComponentType;

    constructor(props: IProps) {
        super(props);

        this.lastKey = 0;
        this.generateKey = () => (++this.lastKey).toString();

        // adding keys to items because they will be reordered and they don't have static IDs to be used as react keys
        const fieldsKeyed = (props.profile.fields ?? []).map(
            (field) => ({key: this.generateKey(), value: field}),
        );

        var grouped = groupBy(fieldsKeyed, (item) => item.value.section);

        this.state = {
            fields: {
                header: grouped[IContentProfileSection.header] ?? [],
                content: grouped[IContentProfileSection.content] ?? [],
            },
            activeTab: getAllContentProfileSections()[0],
        };

        const onSortEnd = ({oldIndex, newIndex}) => {
            this.updateCurrentFields((_fields) => arrayMove(_fields, oldIndex, newIndex));
        };

        class ItemsContainerComponent extends React.PureComponent {
            render() {
                return (
                    <ItemsContainerBaseSortable onSortEnd={onSortEnd}>
                        {this.props.children}
                    </ItemsContainerBaseSortable>
                );
            }
        }

        this.ItemsContainerComponent = ItemsContainerComponent;

        this.updateCurrentFields = this.updateCurrentFields.bind(this);
    }

    updateCurrentFields(
        fn: (items: IArrayKeyed<IContentProfileField>) => IArrayKeyed<IContentProfileField>,
        callback?: () => void,
    ) {
        this.setState(
            {
                fields: {
                    ...this.state.fields,
                    [this.state.activeTab]: fn(this.state.fields[this.state.activeTab]),
                },
            },
            () => {
                if (callback != null) {
                    callback();
                }
            },
        );
    }

    componentDidUpdate() {
        const initialArray: Array<IContentProfileField> = [];

        this.props.profile.fields = getAllContentProfileSections()
            .reduce<Array<IContentProfileField>>(
                (acc, key) => [...acc, ...this.state.fields[key].map(({value}) => value)],
                initialArray,
            );
    }

    render() {
        const {activeTab} = this.state;
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
                    this.updateCurrentFields(
                        (_fields) => {
                            return _fields.map((field) => {
                                if (field.key === item._id) {
                                    return {...field, value: stripSystemId(item)};
                                } else {
                                    return field;
                                }
                            });
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

                    this.updateCurrentFields(
                        (_fields) => [
                            {
                                key: this.generateKey(),
                                value: item,
                            },
                            ..._fields,
                        ],
                        () => {
                            resolve(itemWithId);
                        },
                    );
                });
            },
            delete: (item) => {
                return new Promise((resolve) => {
                    this.updateCurrentFields(
                        (_fields) => _fields.filter(
                            ({key}) => key !== item._id,
                        ),
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
                    getFormConfig={(item) => getFormConfig(IContentProfileTypeNonText[this.props.profileType], item)}
                    ItemComponent={ItemComponent}
                    ItemsContainerComponent={this.ItemsContainerComponent}
                    items={crudManagerForContentProfileFields}
                    disallowFiltering
                    disallowCreatingNewItem
                />
            </div>
        );
    }
}
