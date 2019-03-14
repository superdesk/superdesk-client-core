import React from 'react';
import {MarkedDesksInfo} from '../index';

interface IProps {
    item: any;
}

// tslint:disable-next-line:class-name
export class markedDesks extends React.Component<IProps> {
    render() {
        return React.createElement(MarkedDesksInfo, angular.extend({
            key: 'markedDesks',
        }, this.props));
    }
}
