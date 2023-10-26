import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

export interface IPropsSendToPanel {
    /**
     * Whether panel markup from ui-framework v3 RC should be used.
     * It should be used when {@see authoringReactViewEnabled},
     * but not when send-to panel is opened outside of authoring.
     */
    markupV2: boolean;
    'data-test-id'?: string;
    width?: React.CSSProperties['width'];
}

export class Panel extends React.PureComponent<IPropsSendToPanel> {
    render() {
        if (this.props.markupV2) {
            return (
                <Layout.Panel
                    side="right"
                    open={true}
                    size={this.props.width == null ? 'x-small' : {custom: this.props.width}}
                >
                    {this.props.children}
                </Layout.Panel>
            );
        } else {
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
}
