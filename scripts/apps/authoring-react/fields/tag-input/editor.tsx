import React from 'react';
import {TagInput} from 'superdesk-ui-framework/react';
import {
    IEditorComponentProps,
    ITagInputFieldConfig,
    ITagInputUserPreferences,
    ITagInputValueOperational,
} from 'superdesk-api';

type IProps = IEditorComponentProps<ITagInputValueOperational, ITagInputFieldConfig, ITagInputUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <TagInput
                    items={this.props.value}
                    label={'Tag-input'}
                    freetype
                />
            </Container>
        );
    }
}
