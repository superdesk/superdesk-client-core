import {gettext} from 'core/utils';
import React from 'react';
import {DurationInput, getDurationString} from 'superdesk-ui-framework/react';
import {IInputType} from '../interfaces/input-types';

export class DurationComponent extends React.Component<IInputType<number>> {
    render() {
        if (this.props.previewOutput) {
            return (
                <div
                    data-test-id={`gform-output--${this.props.formField.field}`}
                >
                    {getDurationString(this.props.value)}
                </div>
            );
        }

        return (
            <DurationInput
                label={gettext('Duration')}
                seconds={this.props.value ?? 0}
                onChange={(val) => {
                    this.props.onChange(val);
                }}
                invalid={this.props.issues.length > 0}
                error={this.props.issues[0]}
                required={this.props.formField.required === true}
            />
        );
    }
}
