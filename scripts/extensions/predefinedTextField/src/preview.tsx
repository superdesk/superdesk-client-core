import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<string, never>;

export class PredefinedFieldPreview extends React.PureComponent<IProps> {
    render() {
        return (
            <div dangerouslySetInnerHTML={{__html: this.props.value}} />
        );
    }
}
