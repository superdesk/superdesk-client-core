import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {formatDate} from 'core/get-superdesk-api-implementation';

export class Used extends React.PureComponent<IPropsItemListInfo> {
    label: boolean = false;
    render() {
        const item = this.props.item;

        if (item.used) {
            const title = item.used_updated ? formatDate(item.used_updated, {longFormat: true}) : null;

            return (
                <div className="label label--red2" key="used" title={title}>
                    {gettext('Used')}
                </div>
            );
        }

        return null;
    }
}
