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
    IGenericFormItemComponent,
} from 'superdesk-api';

import {gettext} from 'core/utils';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {IContentProfileTypeNonText} from '../controllers/ContentProfilesController';
import {assertNever} from 'core/helpers/typescript-helpers';
import {GenericListPageComponent} from 'core/ui/components/ListPage/generic-list-page';

interface IProps {
    profile: IContentProfileNonText;
    profileType: keyof typeof IContentProfileTypeNonText;
}

interface IState {
    fields: IArrayKeyed<IContentProfileField>;
}

// subset of FormFieldType
enum IContentProfileFieldTypes {
    textSingleLine = 'textSingleLine',
    number = 'number',
}

function getAllContentProfileFieldTypes(): Array<IContentProfileFieldTypes> {
    return Object.keys(IContentProfileFieldTypes).map((key) => IContentProfileFieldTypes[key]);
}

function getImageFormConfig(): IFormGroup {
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

    const displayInMediaEditor: IFormField = {
        label: gettext('Display in media editor'),
        type: FormFieldType.checkbox,
        field: 'displayOnMediaEditor',
        required: false,
    };

    const formConfig: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: [labelField, idField, sdWidth, fieldType, requiredField, displayInMediaEditor],
    };

    return formConfig;
}

function getVideoFormConfig(): IFormGroup {
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

    const requiredField: IFormField = {
        label: gettext('Required'),
        type: FormFieldType.checkbox,
        field: 'required',
        required: false,
    };

    const formConfig: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: [labelField, idField, requiredField],
    };

    return formConfig;
}

function getFormConfig(type: IContentProfileTypeNonText): IFormGroup {
    switch (type) {
    case IContentProfileTypeNonText.image:
        return getImageFormConfig();
    case IContentProfileTypeNonText.video:
        return getVideoFormConfig();
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

export function getAttributesForFormFieldType(type: IContentProfileFieldTypes): Array<IFormField> {
    switch (type) {
    case IContentProfileFieldTypes.textSingleLine:
        return getAttributesForTextSingleLine();
    case IContentProfileFieldTypes.number:
        return [];
    default:
        assertNever(type);
    }
}

class ItemComponent extends React.PureComponent<IGenericFormItemComponent<IContentProfileFieldWithSystemId>> {
    render() {
        const {item, page} = this.props;

        return (
            <div>
                {item.label}
                <button onClick={() => page.startEditing(item._id)}>{gettext('Edit')}</button>
            </div>
        );
    }
}

type IContentProfileFieldWithSystemId = IContentProfileField & IItemWithId;

function stripSystemId(item: IContentProfileFieldWithSystemId): IContentProfileField {
    const copy = {...item};

    delete copy['_id'];

    return copy;
}

export class ContentProfileConfigNonText extends React.Component<IProps, IState> {
    private generateKey: () => string;
    private lastKey: number;

    constructor(props: IProps) {
        super(props);

        this.lastKey = 0;
        this.generateKey = () => (++this.lastKey).toString();

        this.state = {
            fields: (props.profile.fields ?? []).map(
                (field) => ({key: this.generateKey(), value: field}),
            ),
        };
    }

    componentDidUpdate() {
        this.props.profile.fields = this.state.fields.map(({value}) => value);
    }

    render() {
        const {fields} = this.state;

        const formConfig = getFormConfig(IContentProfileTypeNonText[this.props.profileType]);

        const fieldsResponse: ICrudManagerResponse<IContentProfileFieldWithSystemId> = {
            _items: fields.map(({key, value}) => ({...value, _id: key})),
            _meta: {total: fields.length, page: 1, max_results: fields.length},
        };

        const crudManagerForContentProfileFields: ICrudManager<IContentProfileFieldWithSystemId> = {
            activeFilters: {},
            activeSortOption: {field: 'label', direction: 'ascending'},
            read: () => Promise.resolve(fieldsResponse),
            update: (item) => {
                return new Promise((resolve) => {
                    this.setState(
                        {
                            fields: this.state.fields.map((field) => {
                                if (field.key === item._id) {
                                    return {...field, value: stripSystemId(item)};
                                } else {
                                    return field;
                                }
                            }),
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
                            fields: [
                                {
                                    key: this.generateKey(),
                                    value: item,
                                },
                                ...fields,
                            ],
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
                            fields: this.state.fields.filter(({key}) => key !== item._id),
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

        return (
            <div>
                <GenericListPageComponent
                    formConfig={formConfig}
                    defaultSortOption={{field: 'name', direction: 'ascending'}}
                    ItemComponent={ItemComponent}
                    disallowFiltering
                    items={crudManagerForContentProfileFields}
                />
            </div>
        );
    }
}
