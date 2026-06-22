import React from 'react';
import {
    IDatelineFieldConfig,
    IDatelineValueOperational,
    IPreviewComponentProps,
} from 'superdesk-api';

type IProps = IPreviewComponentProps<IDatelineValueOperational, IDatelineFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // The dateline value is an object; `text` is its composed, human-readable form.
        const text = this.props.value?.text;

        if (text == null || text.length === 0) {
            return null;
        }

        return (
            <div>{text}</div>
        );
    }
}
