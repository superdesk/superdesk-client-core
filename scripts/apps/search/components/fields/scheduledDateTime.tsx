import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {appConfig} from 'appConfig';
import {isScheduled, scheduledFormat} from 'core/datetime/datetime';

type IProps = Pick<IPropsItemListInfo, 'item'>;

class ScheduledDateTime extends React.PureComponent<IProps> {
    datetime: any;

    constructor(props: IProps) {
        super(props);

        this.datetime = ng.get('datetime');
    }
    render() {
        const {item} = this.props;
        const scheduledState = ['scheduled'];

        if (appConfig?.features?.showPublishSchedule) {
            scheduledState.push('in_progress', 'submitted', 'draft');
        }

        if (this.props.item.state != null && scheduledState.includes(this.props.item.state) && isScheduled(item)) {
            const datetimeFormatted = scheduledFormat(item);
            const title = gettext('Article is scheduled for {{schedule}}', {schedule: datetimeFormatted.long});

            return (
                <span
                    key="scheduledDateTime"
                    style={{color: '#da7200', marginInlineEnd: 4}}
                    title={title}
                >
                    {datetimeFormatted.short}
                </span>
            );
        } else {
            return null;
        }
    }
}

export const scheduledDateTime = ScheduledDateTime;
