import {gettext} from 'core/utils';
import React from 'react';
import {
    IEditorComponentProps,
    ITagInputFieldConfig,
    ITagInputUserPreferences,
    ITagInputValueOperational,
} from 'superdesk-api';
import {TagInput} from 'superdesk-ui-framework/react';

type IProps = IEditorComponentProps<ITagInputValueOperational, ITagInputFieldConfig, ITagInputUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <TagInput
                    label=""
                    inlineLabel
                    labelHidden
                    placeholder={gettext('Input tags here')}
                    onChange={this.props.onChange}
                    value={this.props.value}
                />
            </Container>
        );
    }
}
