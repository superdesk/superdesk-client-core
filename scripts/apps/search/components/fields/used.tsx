import React from 'react';
import {gettext} from 'core/utils';
import {longFormat} from 'core/datetime/datetime';
import {IPropsItemListInfo} from '../ListItemInfo';

export class Used extends React.PureComponent<IPropsItemListInfo> {
    label: boolean = false;
    render() {
        const item = this.props.item;

        if (item.used) {
            const title = item.used_updated ? longFormat(item.used_updated) : null;

            return (
                <div className="label label--red2" key="used" title={title}>
                    {gettext('Used')}
                </div>
            );
        }

        return null;
    }
}
