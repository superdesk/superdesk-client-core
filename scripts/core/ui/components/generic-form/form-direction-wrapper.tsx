import React from 'react';

import {IFormGroup} from './interfaces/form';
import {assertNever} from 'core/helpers/typescript-helpers';
import {omit} from 'lodash';

interface IProps {
    className?: string;
    direction: IFormGroup['direction'];
}

export class FormGroupDirectionWrapper extends React.Component<IProps> {
    render() {
        const {direction} = this.props;

        if (direction === 'vertical') {
            return <div {...omit(this.props, ['direction'])} />;
        } else if (direction === 'horizontal') {
            const currentClassname = (this.props.className || '');
            const nextClassname = currentClassname.length > 0
                ? `${currentClassname} form-group-horizontal`
                : 'form-group-horizontal';

            return <div className={nextClassname} />;
        } else {
            assertNever(direction);
        }
    }
}
