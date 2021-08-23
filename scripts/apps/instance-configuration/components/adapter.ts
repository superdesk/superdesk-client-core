import {IFormGroup} from 'superdesk-api';
import {FormFieldType} from 'core/ui/components/generic-form/interfaces/form';
import {assertNever} from 'core/helpers/typescript-helpers';

interface IJsonSchema {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    enum?: Array<string>;
    properties?: Dictionary<string, IJsonSchema>;
    items?: IJsonSchema; // for arrays only
    description?: string;
    required?: Array<string>;
    translations: Dictionary<string, string>;
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
                keys.concat(property),
                schema,
                property,
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

        if (schema.type === 'array') {
            inlineItemsGroup.form.push({
                type: FormFieldType.arrayOf,
                field: formField,
                description,
                label: label,
                required,
                component_parameters: (() => {
                    switch (schema.items.type) {
                    case 'string':
                        if (schema.items.enum != null) { // list of predefined options
                            return {
                                field_type: FormFieldType.select,
                                component_parameters: {
                                    options: schema.items.enum.map((value) => ({id: value, label: value})),
                                },
                            };
                        } else { // free text input
                            return {field_type: FormFieldType.textSingleLine};
                        }
                    case 'number':
                        return {field_type: FormFieldType.number};
                    case 'boolean':
                        return {field_type: FormFieldType.yesNo};
                    case 'object':
                        return {
                            formConfig: jsonSchemaToFormConfig(
                                schema.items,
                                [],
                                {} as any,
                                undefined,
                            ),
                        };
                    case 'array':
                        throw new Error('Not implemented');
                    default:
                        assertNever(schema.items.type);
                    }
                })(),
            });
        } else if (schema.type === 'boolean') {
            inlineItemsGroup.form.push({
                type: FormFieldType.yesNo,
                field: formField,
                description,
                label: label,
                required,
            });
        } else if (schema.type === 'number') {
            inlineItemsGroup.form.push({
                type: FormFieldType.number,
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
