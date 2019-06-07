import React from "react";

interface IProps {
    absolute?: boolean; // will be positioned absolutely
}

export class Loader extends React.Component<IProps> {
    render() {
        const loaderElement = <div className="sd-loader"></div>;

        return this.props.absolute === true
            ? loaderElement
            : <div style={{position: 'relative'}}>{loaderElement}</div>;
    }
}
