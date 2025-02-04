import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class HeadlineComponent extends React.Component<Pick<IPropsItemListInfo, 'item'>> {
    render() {
        const props = this.props;

        const _headline = typeof props.item.headline === 'string' && props.item.headline.length > 0
            ? props.item.headline
            : props.item.type;

        return React.createElement(
            'span',
            {className: 'item-heading', key: 'headline',
                dangerouslySetInnerHTML: {__html: _headline}},
        );
    }
}

export const headline = HeadlineComponent;
