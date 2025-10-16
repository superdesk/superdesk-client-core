import {IBooleanFieldValueOperational, ICommonFieldConfig, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import {Switch} from 'superdesk-ui-framework/react';

type IProps = IEditorComponentProps<IBooleanFieldValueOperational, ICommonFieldConfig, never>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const checkbox = (
            <Switch
                label={{content: ''}}
                value={this.props.value as boolean}
                onChange={(value) => {
                    this.props.onChange(value);
                }}
            />
        );

        const Container = this.props.container;

        return (
            <Container>
                {checkbox}
            </Container>
        );
    }
}
