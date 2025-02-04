import React from 'react';
import {HighlightsInfo} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

class HighlightsComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        return React.createElement(HighlightsInfo, angular.extend({
            key: 'highlights',
        }, props));
    }
}

export const highlights = HighlightsComponent;
