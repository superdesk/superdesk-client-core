import React from 'react';

import {FormGroupDisplayWrapper} from './form-group-display-wrapper';
import {FormGroupDirectionWrapper} from './form-direction-wrapper';
import {IFormGroup} from 'superdesk-api';

interface IProps {
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
