import React from 'react';

import {IFormGroup, isIFormGroup, isIFormField} from './interfaces/form';

import {getFormFieldComponent} from './form-field';
import {assertNever} from 'core/helpers/typescript-helpers';
import {FormGroupWrapper} from './form-group-wrapper';

interface IProps {
    formConfig: IFormGroup;
    item: {[key: string]: any};
    editMode: boolean;
    issues: {[field: string]: Array<string>};
    handleFieldChange(field: keyof IProps['item'], nextValue: valueof<IProps['item']>): void;
}

// The component is recursive!
export class FormViewEdit extends React.Component<IProps> {
    render() {
        const group: IFormGroup = this.props.formConfig;

        return (
            <FormGroupWrapper group={group}>
                {
                    group.form.map((item, i) => {
                        if (isIFormGroup(item)) {
                            return (
                                <FormViewEdit
                                    key={i}
                                    formConfig={item}
                                    item={this.props.item}
                                    editMode={this.props.editMode}
                                    issues={this.props.issues}
                                    handleFieldChange={this.props.handleFieldChange}
                                />
                            );
                        } else if (isIFormField(item)) {
                            const FieldComponent = getFormFieldComponent(item.type);

                            return (
                                <FieldComponent
                                    key={i}
                                    formField={item}
                                    value={this.props.item[item.field]}
                                    disabled={!this.props.editMode}
                                    issues={this.props.issues[item.field] || []}
                                    previewOuput={false}
                                    onChange={
                                        (nextValue) => this.props.handleFieldChange(item.field, nextValue)
                                    }
                                />
                            );
                        } else {
                            return assertNever(item);
                        }
                    })
                }
            </FormGroupWrapper>
        );
    }
}
