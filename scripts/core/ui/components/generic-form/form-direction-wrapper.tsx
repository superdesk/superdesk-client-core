import React from 'react';

import {assertNever} from 'core/helpers/typescript-helpers';
import {omit} from 'lodash';
import {IFormGroup} from 'superdesk-api';

interface IProps<T extends object> {
    className?: string;
    direction: IFormGroup<T>['direction'];
}

export class FormGroupDirectionWrapper<T extends object> extends React.Component<IProps<T>> {
    render() {
        const {direction} = this.props;

        if (direction === 'vertical') {
            return <div {...omit(this.props, ['direction'])} />;
        } else if (direction === 'horizontal') {
            const currentClassname = (this.props.className || '');
            const nextClassname = currentClassname.length > 0
                ? `${currentClassname} form-group-horizontal`
                : 'form-group-horizontal';

            return <div className={nextClassname}>{this.props.children}</div>;
        } else {
            assertNever(direction);
        }
    }
}
