import * as React from 'react';
import {IconLabel, getDurationString} from 'superdesk-ui-framework/react';

import {superdesk} from '../../../superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    duration: number;
    planned_duration: number;
    size?: React.ComponentProps<typeof IconLabel>['size'];
}

export class DurationLabel extends React.PureComponent<IProps> {
    render() {
        const {duration, planned_duration} = this.props;

        return (
            <IconLabel
                text={getDurationString(duration ?? planned_duration, 2)}
                innerLabel={gettext('Duration')}
                style="translucent"
                size={this.props.size}
                type={(() => {
                    if (duration == null || planned_duration == null) {
                        return 'success';
                    } else if (duration > planned_duration) {
                        return 'alert';
                    } else if (duration < planned_duration) {
                        return 'warning';
                    } else {
                        return 'success';
                    }
                })()}
            />
        );
    }
}
