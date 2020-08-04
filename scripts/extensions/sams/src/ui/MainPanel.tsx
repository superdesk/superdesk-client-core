import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
    className?: string;
}

export class MainPanel extends React.PureComponent<IProps> {
    render() {
        const className = !this.props.className ?
            'sd-main-content-grid__content' :
            `sd-main-content-grid__content ${this.props.className}`;

        return (
            <div className={className}>
                {this.props.children}
            </div>
        );
    }
}
