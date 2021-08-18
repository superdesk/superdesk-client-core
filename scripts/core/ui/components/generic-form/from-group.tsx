import React from 'react';

import {isIFormGroup, isIFormField} from './interfaces/form';
import {getFormFieldComponent} from './form-field';
import {assertNever} from 'core/helpers/typescript-helpers';
import {FormGroupWrapper} from './form-group-wrapper';
import {IFormGroup} from 'superdesk-api';

interface IProps {
    formConfig: IFormGroup;
    item: {[key: string]: any};
    editMode: boolean;
    issues: {[field: string]: Array<string>};
    handleFieldChange(field: keyof IProps['item'], nextValue: valueof<IProps['item']>): void;

    /** Internal props below */
    indent?: boolean;
}

// The component is recursive!
export class FormViewEdit extends React.Component<IProps> {
    render() {
        const group: IFormGroup = this.props.formConfig;

        return (
            <FormGroupWrapper group={group}>
                {
                    group.form.map((item, i) => {
                        return (
                            <div key={i} style={this.props.indent ? {paddingLeft: 30} : {}}>
                                {
                                    (() => {
                                        if (isIFormGroup(item)) {
                                            return (
                                                <FormViewEdit
                                                    formConfig={item}
                                                    item={this.props.item}
                                                    editMode={this.props.editMode}
                                                    issues={this.props.issues}
                                                    handleFieldChange={this.props.handleFieldChange}
                                                    indent={true}
                                                />
                                            );
                                        } else if (isIFormField(item)) {
                                            const FieldComponent = getFormFieldComponent(item.type);

                                            return (
                                                <FieldComponent
                                                    key={i}
                                                    formValues={this.props.item}
                                                    formField={item}
                                                    value={this.props.item[item.field]}
                                                    disabled={!this.props.editMode}
                                                    issues={this.props.issues[item.field] || []}
                                                    previewOutput={false}
                                                    onChange={
                                                        (nextValue, fieldName?: string) =>
                                                            this.props.handleFieldChange(
                                                                item.field != null ? item.field : fieldName,
                                                                nextValue,
                                                            )
                                                    }
                                                />
                                            );
                                        } else {
                                            return assertNever(item);
                                        }
                                    })()
                                }
                            </div>
                        );
                    })
                }
            </FormGroupWrapper>
        );
    }
}
