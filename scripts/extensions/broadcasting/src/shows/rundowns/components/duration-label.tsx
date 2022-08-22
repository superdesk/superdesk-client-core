import * as React from 'react';
import {IconLabel} from 'superdesk-ui-framework/react';

import {superdesk} from '../../../superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    duration: number;
    planned_duration: number;
}

export class DurationLabel extends React.PureComponent<IProps> {
    render() {
        const {duration, planned_duration} = this.props;

        return (
            <IconLabel
                text={duration.toString()}
                innerLabel={gettext('Duration')}
                style="translucent"
                size="small"
                type={(() => {
                    if (planned_duration == null) {
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
