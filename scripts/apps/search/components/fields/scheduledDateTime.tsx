import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {appConfig} from 'appConfig';

type IProps = Pick<IPropsItemListInfo, 'item'>;

class ScheduledDateTime extends React.PureComponent<IProps> {
    datetime: any;

    constructor(props: IProps) {
        super(props);

        this.datetime = ng.get('datetime');
    }
    render() {
        const scheduled = this.props.item.archive_item
            ? this.props.item.archive_item.schedule_settings.utc_publish_schedule
            : this.props.item?.publish_schedule || null;
        const scheduledState = ['scheduled'];

        if (appConfig?.features?.showPublishSchedule) {
            scheduledState.push('in_progress', 'submitted');
        }

        if (this.props.item.state != null && scheduledState.includes(this.props.item.state) && scheduled != null) {
            const datetime = this.datetime;
            const title = gettext('Article is scheduled for {{schedule}}', {schedule: datetime.longFormat(scheduled)});

            return (
                <span
                    key="scheduledDateTime"
                    style={{color: '#da7200', marginRight: 4}}
                    title={title}
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
