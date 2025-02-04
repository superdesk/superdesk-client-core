import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';
import {gettext} from 'core/utils';

export class LinesCount extends React.Component<IPropsItemListInfo, any> {
    render() {
        const {lines_count} = this.props.item;

        if (lines_count == null) {
            return null;
        }

        return (
            <span title={gettext('{{x}} lines', {x: lines_count})}>{lines_count}</span>
        );
    }
}
