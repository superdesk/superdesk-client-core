import React from "react";

interface IProps {
    html: string;
}

// is imported from fidelity repo
export class UserHtmlSingleLine extends React.Component<IProps> {
    render() {
        return <div className="user-html-in-single-line" dangerouslySetInnerHTML={{__html: this.props.html}} />;
    }
}
