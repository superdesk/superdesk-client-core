import {ISuperdesk, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import {IDateTimeFieldConfig} from './extension';
import {Switch} from 'superdesk-ui-framework/react';

interface IPropsAdditional {
    hideToggle?: boolean;
}

export function getToggleDateTimeField(superdesk: ISuperdesk) {
    const {notify} = superdesk.ui;
    const {gettext} = superdesk.localization;

    return class ToggleDateTimeField
        extends React.PureComponent<IEditorComponentProps<string | null, IDateTimeFieldConfig> & IPropsAdditional> {
        render() {
            const checkbox = (
                <Switch
                    value={this.props.value != null}
                    onChange={(value) => {
                        if (value) {
                            const initialConfig = this.props.config.initial_offset_minutes;

                            this.props.setValue(`{{ now|add_timedelta(minutes=${initialConfig})|iso_datetime }}`);
                            notify.success(gettext('Time offset is configured to be {{minutes}} minutes',
                                {minutes: initialConfig},
                            ));
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            );

            return (
                <div>
                    {checkbox}
                </div>
            );
        }
    };
}
