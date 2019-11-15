import React from 'react';
import {IPropsSpacer} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';

function getDefaultAlign(spacer: IPropsSpacer): IPropsSpacer['align'] {
    if (spacer.type === 'horizontal') {
        return 'center';
    } else if (spacer.type === 'vertical') {
        return 'start';
    } else {
        return assertNever(spacer.type);
    }
}

export class Spacer extends React.PureComponent<IPropsSpacer> {
    render() {
        const align = this.props.align ?? getDefaultAlign(this.props);

        const classNames = [
            'sd-spacer',
            'sd-spacer--' + this.props.type,
            'sd-spacer--' + this.props.type + '-' + this.props.spacing,
            'sd-spacer--' + align,
        ];

        return (
            <div className={classNames.join(' ')}>
                {this.props.children.map((el, i) => (
                    <div key={i}>{el}</div>
                ))}
            </div>
        );
    }
}