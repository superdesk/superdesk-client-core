import React from 'react';

interface IProps {
    html: string;
    showAsPlainText?: boolean; // if true, html is shown as plain text (no format)
}

function stripHtmlTags (html) {
    const el = document.createElement('div');

    el.innerHTML = html;
    return el.innerText;
}

// is imported from fidelity repo
export class UserHtmlSingleLine extends React.Component<IProps> {
    render() {
        const { html, showAsPlainText = false } = this.props;

        if (showAsPlainText) {
            return <span className="user-html-in-single-line">{stripHtmlTags(html)}</span>;
        }

        return <span className="user-html-in-single-line" dangerouslySetInnerHTML={{__html: html}} />;
    }
}
