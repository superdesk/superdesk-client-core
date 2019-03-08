import React from 'react';
import {HighlightsInfo} from '../index';

interface IProps {
    item: any;
}

export class highlights extends React.Component<IProps> {
    render() {
        return React.createElement(HighlightsInfo, angular.extend({
            key: 'highlights',
        }, this.props));
    }
}
