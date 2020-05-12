import React from 'react';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {longFormat} from 'core/datetime/datetime';

interface IProps {
    item: IArticle;
    svc: any;
}

export class Used extends React.PureComponent<IProps> {
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
