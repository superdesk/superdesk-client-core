import React from 'react';
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
                <input
                    type="number"
                    value={this.props.value ?? 0}
                    onChange={(event) => { // TODO: use duration input
                        const val = event.target.value;

                        this.props.onChange(val === '' ? null : parseInt(val, 10));
                    }}
                    required
                />
            </Container>
        );
    }
}
