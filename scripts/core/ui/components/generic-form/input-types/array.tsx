/* eslint-disable react/no-multi-comp */

import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {getFormFieldComponent} from '../form-field';
import {FormFieldType} from '../interfaces/form';
import {IFormField, IFormGroup} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IconButton, Button} from 'superdesk-ui-framework/react';
import {arrayMove} from 'core/helpers/utils';
import {getInitialValueForFieldType} from '../get-initial-values';
import {FormViewEdit} from '../from-group';

interface IPropsArrayFieldNestedForm {
    formConfig: IFormGroup;
    item: Dictionary<string, any>;
    items: Array<Dictionary<string, any>>;
    onChange(nextArray: Array<Dictionary<string, any>>): void;
}

class ArrayFieldNestedForm extends React.PureComponent<IPropsArrayFieldNestedForm> {
    render() {
        const {
            formConfig,
            items,
            item,
        } = this.props;

        return (
            <FormViewEdit
                formConfig={formConfig}
                item={item}
                handleFieldChange={(field, value) => {
                    const nextArray = [...items];
                    const index = items.indexOf(item);

                    nextArray[index] = {
                        ...item,
                        [field]: value,
                    };

                    this.props.onChange(nextArray);
                }}
                issues={{}}
                editMode={true}
            />
        );
    }
}

interface IPropsArrayFieldSingleTypeField {
    arrayField: IFormField;
    item: Dictionary<string, any>;
    items: Array<Dictionary<string, any>>;
    formValuesFromArray: any;
    onChange(nextArray: Array<Dictionary<string, any>>): void;
}

class ArrayFieldSingleTypeField extends React.PureComponent<IPropsArrayFieldSingleTypeField> {
    render() {
        const {items, item, formValuesFromArray} = this.props;
        const type: FormFieldType = this.props.arrayField.component_parameters.field_type;
        const fieldParameters = this.props.arrayField.component_parameters.component_parameters;
        const i = items.indexOf(item);

        const formField: IFormField = {
            type: type,
            component_parameters: fieldParameters,
            field: i.toString(),

            /**
             * Setting to `false` in order to avoid red stars in the UI for every item.
             * In reality it should be always `true`, because it's being applied to array items.
             * Array item should either be required or not be added to the array at all.
             */
            required: false,
        };

        const FieldComponent = getFormFieldComponent(type);

        return (
            <FieldComponent
                formValues={formValuesFromArray}
                formField={formField}
                value={item}
                disabled={false}
                issues={[]}
                previewOutput={false}
                onChange={
                    (nextValue, fieldName?: string) => {
                        const nextArray = [...items];

                        nextArray[i] = nextValue;

                        this.props.onChange(nextArray);
                    }
                }
            />
        );
    }
}

/**
 * This field type can handle either:
 *      an array of fields of the same type (anything in `FormFieldType`)
 *      or an array of nested forms with the same schema, for example `Array<{firstName: string; lastName: string}>`
 *
 * If `props.formField.component_parameters.formConfig` is not `null`, it means it's an array of nested forms.
 * Otherwise, it's an array of fields.
 */
export class ArrayField extends React.Component<IInputType<Array<any>>> {
    render() {
        if (this.props.previewOutput) {
            return <div data-test-id={`gform-output--${this.props.formField.field}`}>{this.props.value}</div>;
        }

        const items: Array<any> = this.props.value ?? [];
        const type: FormFieldType = this.props.formField.component_parameters.field_type;
        const formConfig: IFormGroup = this.props.formField.component_parameters.formConfig;

        return (
            <div
                className={
                    classNames(
                        'sd-line-input',
                        {
                            'sd-line-input--invalid': this.props.issues.length > 0,
                        },
                    )
                }
            >
                <label className="sd-line-input__label">
                    {this.props.formField.label}
                    {
                        this.props.formField.required && (
                            <span style={{color: '#E51C23'}} aria-label={gettext('required')}>*</span>
                        )
                    }
                </label>

                <div>
                    {
                        items.map((item, i) => {
                            const formValuesFromArray = items.reduce((acc, _item, index) => {
                                acc[index] = _item;

                                return acc;
                            }, {});

                            const isFirst = i === 0;
                            const isLast = i === items.length - 1;

                            return (
                                <div key={i} className="space-between" style={{marginBottom: 10}}>
                                    <div>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            {
                                                !isFirst && (
                                                    <IconButton
                                                        size="small"
                                                        icon="chevron-up-thin"
                                                        ariaValue={gettext('move up')}
                                                        onClick={() => {
                                                            this.props.onChange(
                                                                arrayMove(items, i, i - 1),
                                                            );
                                                        }}
                                                    />
                                                )
                                            }

                                            {
                                                !isLast && (
                                                    <IconButton
                                                        size="small"
                                                        icon="chevron-down-thin"
                                                        ariaValue={gettext('move down')}
                                                        onClick={() => {
                                                            this.props.onChange(
                                                                arrayMove(items, i, i + 1),
                                                            );
                                                        }}
                                                    />
                                                )
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <IconButton
                                            size="small"
                                            icon="plus-large"
                                            ariaValue={gettext('Add')}
                                            onClick={() => {
                                                const arrayNext = [...items];

                                                arrayNext.splice(i + 1, 0, '');

                                                this.props.onChange(arrayNext);
                                            }}
                                        />

                                        <IconButton
                                            size="small"
                                            icon="minus-small"
                                            ariaValue={gettext('Remove')}
                                            onClick={() => {
                                                this.props.onChange(items.filter((_, index) => index !== i));
                                            }}
                                        />
                                    </div>

                                    <div style={{flexGrow: 1, paddingLeft: 20}}>
                                        {
                                            formConfig != null
                                                ? (
                                                    <ArrayFieldNestedForm
                                                        formConfig={formConfig}
                                                        items={items}
                                                        item={item}
                                                        onChange={(val) => {
                                                            this.props.onChange(val);
                                                        }}
                                                    />
                                                )
                                                : (
                                                    <ArrayFieldSingleTypeField
                                                        arrayField={this.props.formField}
                                                        items={items}
                                                        item={item}
                                                        formValuesFromArray={formValuesFromArray}
                                                        onChange={(val) => {
                                                            this.props.onChange(val);
                                                        }}
                                                    />
                                                )
                                        }

                                    </div>
                                </div>
                            );
                        })
                    }

                    <div>
                        <Button
                            text={gettext('Add')}
                            onClick={() => {
                                const newItem = formConfig != null ? {} : getInitialValueForFieldType(type);

                                this.props.onChange(items.concat(newItem));
                            }}
                        />
                    </div>
                </div>

                {
                    this.props.formField.description && (
                        <span className="sd-line-input__hint">{this.props.formField.description}</span>
                    )
                }

                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}
