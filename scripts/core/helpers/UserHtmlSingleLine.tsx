import React from 'react';
import {stripHtmlTags} from 'core/utils';

interface IProps {
    html: string;
    showAsPlainText?: boolean; // if true, html is shown as plain text (no format)
}

// is imported from fidelity repo
export class UserHtmlSingleLine extends React.Component<IProps> {
    render() {
        const {html, showAsPlainText = false} = this.props;

        if (showAsPlainText) {
            return <span className="user-html-in-single-line">{stripHtmlTags(html)}</span>;
        }

        return <span className="user-html-in-single-line" dangerouslySetInnerHTML={{__html: html}} />;
    }
}
