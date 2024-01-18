import React from 'react';
import {TimePicker} from 'superdesk-ui-framework/react';
import {
    ITimeValueOperational,
    ITimeFieldConfig,
    ITimeUserPreferences,
    IEditorComponentProps,
} from 'superdesk-api';
import {gettext} from 'core/utils';

type IProps = IEditorComponentProps<ITimeValueOperational, ITimeFieldConfig, ITimeUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <TimePicker
                    label=""
                    labelHidden
                    inlineLabel
                    value={this.props.value ?? ''}
                    onChange={(val) => {
                        this.props.onChange(val === '' ? null : val);
                    }}
                    disabled={this.props.readOnly}
                    allowSeconds={this.props.config.allowSeconds}
                />
            </Container>
        );
    }
}
