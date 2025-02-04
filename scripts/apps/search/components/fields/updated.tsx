import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class UpdatedComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        const openItem = function(event) {
            event.stopPropagation();
            props.openAuthoringView(props.item.rewritten_by);
        };

        if (props.item.rewritten_by) {
            return React.createElement(
                'div',
                {className: 'state-label updated', key: 'updated', onClick: openItem},
                gettext('Updated'),
            );
        } else {
            return null;
        }
    }
}

export const updated = UpdatedComponent;
