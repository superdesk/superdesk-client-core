import {ISuperdesk, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import {IDateTimeFieldConfig} from './extension';
import {Switch} from 'superdesk-ui-framework/react';

interface IPropsAdditional {
    hideToggle?: boolean;
}

export function getToggleDateTimeField(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return class ToggleDateTimeField
        extends React.PureComponent<IEditorComponentProps<string | null, IDateTimeFieldConfig> & IPropsAdditional> {
        render() {
            const initialConfig = this.props.config.initial_offset_minutes;
            const checkbox = (
                <Switch
                    value={this.props.value != null}
                    onChange={(value) => {
                        if (value) {
                            this.props.setValue(`{{ now|add_timedelta(minutes=${initialConfig})|iso_datetime }}`);
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            );
            const messageText = gettext(
                `Time offset is configured to be {{minutes}} minutes for this field. When an article is created
                based on this template, it's value will initialize to creation time plus {{offset}} minutes`,
                {minutes: initialConfig, offset: initialConfig},
            );

            return (
                <>
                    <div>
                        {checkbox}
                    </div>
                    <div>
                        {this.props.template?.data?.extra?.DueBy &&
                            (
                                <span className="authoring-header__hint">
                                    {messageText}
                                </span>
                            )
                        }
                    </div>
                </>
            );
        }
    };
}
