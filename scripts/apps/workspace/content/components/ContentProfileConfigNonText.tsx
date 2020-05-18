/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IContentProfileNonText, IFormGroup, IFormField, IContentProfileField, IArrayKeyed} from 'superdesk-api';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {gettext} from 'core/utils';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {Button} from 'superdesk-ui-framework';
import {IContentProfileTypeNonText} from '../controllers/ContentProfilesController';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IProps {
    profile: IContentProfileNonText;
    profileType: keyof typeof IContentProfileTypeNonText;
}

interface IState {
    fields: IArrayKeyed<IContentProfileField>;
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
        form: [labelField, idField, requiredField, displayInMediaEditor],
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

class FieldComponent extends React.PureComponent<{
    field: IArrayKeyed<IContentProfileField>[0];
    profileType: IContentProfileTypeNonText;
    onChange(field: IArrayKeyed<IContentProfileField>[0]): void;
    onRemove(): void}
> {
    render() {
        const {field} = this.props;
        const formConfig = getFormConfig(this.props.profileType);

        return (
            <div style={{
                border: '1px solid green',
                marginBottom: 10,
                marginTop: 10,
                zIndex: 1051,
                padding: 10,
                background: '#fff',
            }}>
                <FormViewEdit
                    formConfig={formConfig}
                    item={field.value}
                    editMode
                    handleFieldChange={(key, value) => {
                        this.props.onChange({...field, value: {...field.value, [key]: value}});
                    }}
                    issues={{}}
                />
                <Button text={gettext('Remove')} onClick={() => this.props.onRemove()} />
            </div>
        );
    }
}

const FieldSortable = SortableElement(FieldComponent);

class FieldsComponent extends React.Component<{
    fields: IArrayKeyed<IContentProfileField>;
    profileType: IContentProfileTypeNonText;
    onChange(fields: IArrayKeyed<IContentProfileField>): void;
}> {
    render() {
        const {fields} = this.props;

        return (
            <div>
                {
                    fields.map((field, index) => (
                        <FieldSortable
                            key={field.key}
                            index={index}
                            field={field}
                            profileType={this.props.profileType}
                            onChange={(_field) => {
                                const fieldsNext = this.props.fields.map((f) => f.key === _field.key ? _field : f);

                                this.props.onChange(fieldsNext);
                            }}
                            onRemove={() => {
                                this.props.onChange(fields.filter((f) => f.key !== field.key));
                            }}
                        />
                    ))
                }
            </div>
        );
    }
}

const FieldsSortable = SortableContainer(FieldsComponent);

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

        return (
            <div>
                <Button
                    text={gettext('Add')}
                    onClick={() => {
                        this.setState({
                            fields: [
                                {key: this.generateKey(), value: {id: '', label: '', required: false}},
                                ...fields,
                            ],
                        });
                    }}
                />

                <FieldsSortable
                    fields={fields}
                    profileType={IContentProfileTypeNonText[this.props.profileType]}
                    onChange={(_fields) => {
                        this.setState({fields: _fields});
                    }}
                    onSortEnd={({oldIndex, newIndex}) => {
                        this.setState({
                            fields: arrayMove(fields, oldIndex, newIndex),
                        });
                    }}
                />
            </div>
        );
    }
}
