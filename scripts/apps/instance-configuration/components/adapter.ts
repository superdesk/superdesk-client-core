import {IFormGroup} from 'superdesk-api';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';

interface IJsonSchema {
    type: 'object' | 'boolean';
    enum?: Array<string>;
    translations: Dictionary<string, string>;
    required?: Array<string>;
    description?: string;
    properties?: Dictionary<string, IJsonSchema>;
}

export function jsonSchemaToFormConfig(
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
            const configsForProperty = jsonSchemaToFormConfig(
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
        const description = parent.properties[field].description;

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
                description,
                label: label,
                required,
            });
        } else if (schema.enum != null) {
            inlineItemsGroup.form.push({
                type: FormFieldType.select,
                field: formField,
                label: label,
                description,
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
                description,
                required,
            });
        }

        return inlineItemsGroup;
    }
}
