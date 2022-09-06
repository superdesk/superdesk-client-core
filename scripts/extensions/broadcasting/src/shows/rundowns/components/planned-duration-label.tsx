import * as React from 'react';
import {IconLabel} from 'superdesk-ui-framework/react';
import {getDurationString} from 'superdesk-ui-framework/react';

import {superdesk} from '../../../superdesk';

const {gettext} = superdesk.localization;

interface IProps {
    planned_duration: number;
    size?: React.ComponentProps<typeof IconLabel>['size'];
}

export class PlannedDurationLabel extends React.PureComponent<IProps> {
    render() {
        const {planned_duration} = this.props;

        return (
            <IconLabel
                text={getDurationString(planned_duration)}
                innerLabel={gettext('Planned duration')}
                icon="time"
                style="translucent"
                size={this.props.size}
            />
        );
    }
}
