import * as React from 'react';
import {gettext} from 'core/utils';
import {getInstanceConfigSchema} from 'instance-settings';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {IFormGroup} from 'superdesk-api';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';

type IProps = {};

interface IState {
    formData: any;
}

interface IJsonSchema {
    type: 'object' | 'boolean';
    enum?: Array<string>;
    translations: Dictionary<string, string>;
    required?: Array<string>;
    properties?: Dictionary<string, IJsonSchema>;
}

function getFormConfig(
    schema: IJsonSchema,
    keys: Array<string>,
    parent?: IJsonSchema,
    field?: string,
): IFormGroup {
    const hasChildren = schema.properties != null;

    if (hasChildren) {
        const type: IFormGroup['type'] = field == null
            ? 'inline'
            : {label: parent.translations[field], openByDefault: true};

        const subgroup: IFormGroup = {
            direction: 'vertical',
            type: type,
            form: [],
        };

        for (const property of Object.keys(schema.properties)) {
            const configsForProperty = getFormConfig(
                schema.properties[property],
                keys.concat(property), schema, property,
            );

            if (configsForProperty.type === 'inline') {
                subgroup.form.push(...configsForProperty.form);
            } else {
                subgroup.form.push(configsForProperty);
            }
        }

        return subgroup;
    } else {
        const formField = keys.join('.');
        const label = parent.translations[field];
        const required = parent.required?.includes(field) === true;

        const inlineItemsGroup: IFormGroup = {
            direction: 'vertical',
            type: 'inline',
            form: [],
        };

        // eslint-disable-next-line no-lonely-if
        if (schema.type === 'boolean') {
            inlineItemsGroup.form.push({
                type: FormFieldType.yesNo,
                field: formField,
                label: label,
                required,
            });
        } else if (schema.enum != null) {
            inlineItemsGroup.form.push({
                type: FormFieldType.select,
                field: formField,
                label: label,
                required,
                component_parameters: {
                    options: schema.enum.map((val) => ({id: val, label: val})),
                },
            });
        } else {
            inlineItemsGroup.form.push({
                type: FormFieldType.textSingleLine,
                field: formField,
                label: label,
                required,
            });
        }

        return inlineItemsGroup;
    }
}

export class InstanceConfigurationSettings extends React.PureComponent <IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            formData: {},
        };
    }

    render() {
        const {formData} = this.state;

        return (
            <div style={{padding: 40}}>

                <h1>{gettext('Instance configuration')}</h1>

                <pre>
                    {JSON.stringify(formData, null, 4)}
                </pre>

                <FormViewEdit
                    formConfig={getFormConfig(getInstanceConfigSchema(gettext) as any, [], {} as any, undefined)}
                    item={formData}
                    handleFieldChange={(field, value) => {
                        this.setState({
                            formData: {
                                ...formData,
                                [field]: value,
                            },
                        });
                    }}
                    issues={{}}
                    editMode={true}
                />
            </div>
        );
    }
}
