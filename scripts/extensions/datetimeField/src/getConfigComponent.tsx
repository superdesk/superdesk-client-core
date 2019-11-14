import {ISuperdesk, IConfigComponentProps} from 'superdesk-api';
import * as React from 'react';

export function getConfigComponent(superdesk: ISuperdesk) {
    const gettext = superdesk.localization.gettext;

    return class DateTimeFieldConfig extends React.PureComponent<IConfigComponentProps> {
        render() {
            return (
                <div>
                    <input type="text" onChange={(event) => {
                        this.props.onChange({testfield: event.target.value});
                    }} />
                    {gettext('testlabel')}
                </div>
            );
        }
    };
}
