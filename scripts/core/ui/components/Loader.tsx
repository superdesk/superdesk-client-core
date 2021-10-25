import React from 'react';

interface IProps {
    absolute?: boolean; // will be positioned absolutely
    grow?: boolean;
}

export class Loader extends React.Component<IProps> {
    render() {
        const loaderElement = <div className="sd-loader" />;
        const grow = this.props.grow ?? true;

        const style: React.CSSProperties = grow
            ? {position: 'relative', width: '100%', height: '100%'}
            : {position: 'relative', width: '60px', height: '30px'};

        return this.props.absolute === true
            ? loaderElement
            : <div style={style}>{loaderElement}</div>;
    }
}
