import React from 'react';

// is imported from fidelity repo
export class UserHtmlSingleLine extends React.Component<{html: string}> {
    render() {
        return <span className="user-html-in-single-line" dangerouslySetInnerHTML={{__html: this.props.html}} />;
    }
}
