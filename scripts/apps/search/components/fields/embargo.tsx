import React from 'react';
import {correctTimezone, gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {TZDate} from '@sourcefabric/date-fns-tz';

class EmbargoComponent extends React.PureComponent<IPropsItemListInfo> {
    render() {
        const item = this.props.item;
        const embargoDateString = item.embargo || item.embargoed;

        const tooltip: string | null = (() => {
            if (embargoDateString != null && item.schedule_settings?.time_zone != null) {
                const embargoDate: TZDate = correctTimezone(
                    item.embargo || item.embargoed,
                    item.schedule_settings.time_zone,
                );

                if (new Date() > embargoDate) { // expired
                    return null;
                }

                return gettext(
                    'Embargo until {{date}}',
                    {
                        date: formatDate(embargoDate, {longFormat: true}),
                    },
                );
            } else if (item.embargoed_text != null) {
                return gettext('Embargo: {{text}}', {text: item.embargoed_text});
            } else {
                return null;
            }
        })();

        if (tooltip == null) {
            return null;
        }

        return (
            <span
                key="embargo"
                className="state-label state_embargo"
                title={tooltip}
            >
                {gettext('Embargo')}
            </span>
        );
    }
}

export const embargo = EmbargoComponent;
