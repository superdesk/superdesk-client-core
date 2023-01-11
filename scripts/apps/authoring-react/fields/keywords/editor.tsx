import React from 'react';
import {TagInput} from 'superdesk-ui-framework/react';
import {
    IEditorComponentProps,
    IKeywordsFieldConfig,
    IKeywordsUserPreferences,
    IKeywordsValueOperational,
} from 'superdesk-api';

type IProps = IEditorComponentProps<IKeywordsValueOperational, IKeywordsFieldConfig, IKeywordsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <TagInput
                    items={this.props.value}
                    label={'Keywords'}
                    freetype
                />
            </Container>
        );
    }
}
