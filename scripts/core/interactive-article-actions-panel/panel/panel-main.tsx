import React from 'react';

export interface IPropsSendToPanel {
    'data-test-id'?: string;
    width?: React.CSSProperties['width'];
}

export class Panel extends React.PureComponent<IPropsSendToPanel> {
    render() {
        return (
            <div
                className="sd-overlay-panel sd-overlay-panel--open sd-overlay-panel--dark-ui"
                data-test-id={this.props['data-test-id']}
                style={this.props.width == null ? undefined : {width: this.props.width}}
            >
                <div className="side-panel side-panel--shadow-right side-panel--dark-ui" data-theme="dark-ui">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
