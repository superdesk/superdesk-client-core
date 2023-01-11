import React from 'react';
import {IKeywordsFieldConfig, IKeywordsValueOperational, IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<IKeywordsValueOperational, IKeywordsFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div>{this.props.value}</div>
        );
    }
}
