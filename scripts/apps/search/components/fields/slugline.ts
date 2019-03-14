import React from 'react';
import {createMarkUp} from '../../helpers';

interface IProps {
    item: any;
}

// tslint:disable-next-line:class-name
export class slugline extends React.Component<IProps> {
    render() {
        if (this.props.item.slugline) {
            return React.createElement(
                'span',
                {className: 'keyword', key: 'slugline',
                    dangerouslySetInnerHTML: createMarkUp(this.props.item.slugline)},
            );
        }
    }
}
