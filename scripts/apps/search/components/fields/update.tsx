import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class UpdateComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.correction_sequence) {
            return React.createElement(
                'div',
                {
                    className: 'provider',
                    key: 'update',
                    title: gettext('correction sequence'),
                },
                gettext('Update {{sequence}}', {sequence: props.item.correction_sequence}),
            );
        } else {
            return null;
        }
    }
}

export const update = UpdateComponent;
