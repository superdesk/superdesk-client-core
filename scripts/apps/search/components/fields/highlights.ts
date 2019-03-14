import React from 'react';
import {HighlightsInfo} from '../index';

interface IProps {
    item: any;
}

// tslint:disable-next-line:class-name
export class highlights extends React.Component<IProps> {
    render() {
        return React.createElement(HighlightsInfo, angular.extend({
            key: 'highlights',
        }, this.props));
    }
}
