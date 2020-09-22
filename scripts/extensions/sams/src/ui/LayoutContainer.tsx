import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
}

export class LayoutContainer extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                style={{height: '100%'}}
                className="sd-content-wrapper__main-content-area sd-main-content-grid comfort"
            >
                {this.props.children}
            </div>
        );
    }
}
