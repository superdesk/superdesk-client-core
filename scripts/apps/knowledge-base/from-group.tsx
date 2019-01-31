import React from "react";
import {ToggleBoxNext} from 'superdesk-ui-framework';
import {IFormGroup, isIFormGroupCollapsible, isIFormGroup, isIFormField, IFormField} from "./interfaces/form";
import {assertNever} from "core/helpers/typescript-helpers";
import {TextSingleLine} from "./input-types/text-single-line";

interface IProps {
    formConfig: IFormGroup;
    item: {[key: string]: any};
    editMode: boolean;
    handleFieldChange(field: keyof IProps['item'], nextValue: valueof<IProps['item']>): void;
}

const inlineWrapper = ({children}) => <div>{children}</div>;

function getGroupWrapper(type: IFormGroup['type']) {
    if (type === 'inline') {
        return inlineWrapper;
    } else if (isIFormGroupCollapsible(type)) {
        const {label, openByDefault} = type;
        // TODO: check if needs to be moved out of the scope
        return (props) => ToggleBoxNext.bind(null, {...props, title: label, isOpen: openByDefault});
    } else {
        assertNever(type);
    }
}

const formGroupVerticalWrapper = ({children}) => <div className="direction-vertical">{children}</div>;
const formGroupHorizontalWrapper = ({children}) => <div className="direction-horizontal">{children}</div>;
function getGroupItemWrapper(direction: IFormGroup['direction']) {
    if (direction === 'vertical') {
        return formGroupVerticalWrapper;
    } else if (direction === 'horizontal') {
        return formGroupHorizontalWrapper;
    } else {
        assertNever(direction);
    }
}

function getFormFieldComponent(type: IFormField['type']) {
    if (type === 'single_line_text') {
        return TextSingleLine;
    } else {
        assertNever(type);
    }
}

// The component is recursive!
export class FormViewEdit extends React.Component<IProps> {
    render() {
        const group = this.props.formConfig;
        const GroupWrapper = getGroupWrapper(group.type);
        const ItemWrapper = getGroupItemWrapper(group.direction);

        return (
            <GroupWrapper>
                {
                    group.form.map((item, i) => {
                        if (isIFormGroup(item)) {
                            return (
                                <FormViewEdit
                                    key={i}
                                    formConfig={item}
                                    item={this.props.item}
                                    editMode={this.props.editMode}
                                    handleFieldChange={this.props.handleFieldChange}
                                />
                            );
                        } else if (isIFormField(item)) {
                            const FieldComponent = getFormFieldComponent(item.type);

                            return (
                                <ItemWrapper key={i}>
                                    <FieldComponent
                                        formField={item}
                                        value={this.props.item[item.field]}
                                        disabled={!this.props.editMode}
                                        onChange={(nextValue) => this.props.handleFieldChange(item.field, nextValue) }
                                    />
                                </ItemWrapper>
                            );
                        } else {
                            assertNever(item);
                        }
                    })
                }
            </GroupWrapper>
        );
    }
}
