import * as React from 'react';
import {ISuperdesk} from 'superdesk-api';

export function getMarkedForMeComponent(superdesk: ISuperdesk) {
    return class MarkedForMe extends React.PureComponent {
        render() {
            const {gettext} = superdesk.localization;

            return (
                <div>{gettext('test')}</div>
            );
        }
    };
}
