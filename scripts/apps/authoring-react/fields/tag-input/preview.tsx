import {gettext} from 'core/utils';
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
                inlineLabel
                labelHidden
                label={gettext('Tag input')}
                disabled
                value={this.props.value}
                onChange={() => null}
                placeholder=""
            />
        );
    }
}
