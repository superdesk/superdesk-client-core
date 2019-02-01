import React from "react";

import {IFormGroup} from "./interfaces/form";
import {FormGroupDisplayWrapper} from "./form-group-display-wrapper";
import {FormGroupDirectionWrapper} from "./form-direction-wrapper";

interface IProps extends React.AllHTMLAttributes<HTMLDivElement> {
    group: IFormGroup;
}

export class FormGroupWrapper extends React.Component<IProps> {
    render() {
        return (
            <FormGroupDisplayWrapper group={this.props.group}>
                <FormGroupDirectionWrapper direction={this.props.group.direction}>
                    {/* direction wrapper is based on CSS and has to be the immediate parent of this.props.children */}
                    {this.props.children}
                </FormGroupDirectionWrapper>
            </FormGroupDisplayWrapper>
        );
    }
}
