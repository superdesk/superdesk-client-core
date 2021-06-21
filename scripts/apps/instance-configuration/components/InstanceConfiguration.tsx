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
    translations: Dictionary<string, string>;
    properties?: Dictionary<string, IJsonSchema>;
}

function getFormConfig(
    schema: IJsonSchema,
    keys: Array<string>,
    parent?: IJsonSchema,
    field?: string,
): IFormGroup {
    const data: IFormGroup = {
        direction: 'vertical',
        type: 'inline',
        form: [],
    };

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
            subgroup.form.push(
                getFormConfig(schema.properties[property], keys.concat(property), schema, property),
            );
        }

        data.form.push(subgroup);
    } else {
        const formField = keys.join('.');
        const label = parent.translations[field];

        // eslint-disable-next-line no-lonely-if
        if (schema.type === 'boolean') {
            data.form.push({
                type: FormFieldType.yesNo,
                field: formField,
                label: label,
            });
        } else {
            data.form.push({
                type: FormFieldType.textSingleLine,
                field: formField,
                label: label,
            });
        }
    }

    return data;
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
