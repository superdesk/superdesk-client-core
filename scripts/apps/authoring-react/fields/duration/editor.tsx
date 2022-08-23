import React from 'react';
import {DurationInput} from 'superdesk-ui-framework/react';
import {
    IDurationValueOperational,
    IDurationFieldConfig,
    IDurationUserPreferences,
    IEditorComponentProps,
} from 'superdesk-api';

type IProps = IEditorComponentProps<IDurationValueOperational, IDurationFieldConfig, IDurationUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <DurationInput
                    label=""
                    inlineLabel
                    labelHidden
                    seconds={this.props.value ?? 0}
                    onChange={(val) => {
                        this.props.onChange(val);
                    }}
                    disabled={this.props.readOnly}
                />
            </Container>
        );
    }
}
