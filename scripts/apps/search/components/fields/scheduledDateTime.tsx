import React from 'react';
import ng from 'core/services/ng';
import {IPropsItemListInfo} from '../ListItemInfo';

type IProps = Pick<IPropsItemListInfo, 'item'>;

class ScheduledDateTime extends React.PureComponent<IProps> {
    datetime: any;

    constructor(props: IProps) {
        super(props);

        this.datetime = ng.get('datetime');
    }
    render() {
        const scheduled = this.props.item.archive_item
            ? this.props.item.archive_item.schedule_settings.utc_publish_schedule : null;

        if (this.props.item.state != null && this.props.item.state === 'scheduled' && scheduled != null) {
            const datetime = this.datetime;

            return (
                <span
                    key="scheduledDateTime"
                    style={{color: '#da7200', marginRight: 4}}
                >
                    { datetime.scheduledFormat(scheduled) }
                </span>
            );
        } else {
            return null;
        }
    }
}

export const scheduledDateTime = ScheduledDateTime;
