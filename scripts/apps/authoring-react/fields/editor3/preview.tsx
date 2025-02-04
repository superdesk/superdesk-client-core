import * as React from 'react';
import {IPreviewComponentProps, IEditor3ValueOperational, IEditor3Config} from 'superdesk-api';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';

export class Preview extends React.PureComponent<IPreviewComponentProps<IEditor3ValueOperational, IEditor3Config>> {
    render() {
        const {value, config} = this.props;

        if (value == null) {
            return null;
        }

        const contentState = value.contentState;

        if (config.singleLine) {
            return (
                <div>{contentState.getPlainText()}</div>
            );
        } else {
            return (
                <div dangerouslySetInnerHTML={{__html: editor3StateToHtml(contentState)}} />
            );
        }
    }
}
