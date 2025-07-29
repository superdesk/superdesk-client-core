import React from 'react';

import {FormGroupDisplayWrapper} from './form-group-display-wrapper';
import {FormGroupDirectionWrapper} from './form-direction-wrapper';
import {IFormGroup} from 'superdesk-api';

interface IProps<T extends object> {
    group: IFormGroup<T>;
}

export class FormGroupWrapper<T extends object> extends React.Component<IProps<T>> {
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
