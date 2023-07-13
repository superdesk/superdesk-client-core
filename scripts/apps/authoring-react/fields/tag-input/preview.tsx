import React from 'react';
import {ITagInputFieldConfig, ITagInputValueOperational, IPreviewComponentProps} from 'superdesk-api';
import {TagInput} from 'superdesk-ui-framework/react';

type IProps = IPreviewComponentProps<ITagInputValueOperational, ITagInputFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <TagInput
                label=""
                inlineLabel
                labelHidden
                disabled
                value={this.props.value}
                onChange={() => null}
                placeholder=""
            />
        );
    }
}
