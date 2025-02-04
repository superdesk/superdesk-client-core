import React from 'react';
import {MarkedDesksInfo} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class MarkedDesksComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return React.createElement(MarkedDesksInfo, angular.extend({
            key: 'markedDesks',
        }, props));
    }
}

export const markedDesks = MarkedDesksComponent;
