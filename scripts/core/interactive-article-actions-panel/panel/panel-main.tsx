import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

export interface IPropsSendToPanel {
    /**
     * Whether panel markup from ui-framework v3 RC should be used.
     * It should be used when {@see authoringReactViewEnabled},
     * but not when send-to panel is opened outside of authoring.
     */
    markupV2: boolean;
}

export class Panel extends React.PureComponent<IPropsSendToPanel> {
    render() {
        if (this.props.markupV2) {
            return (
                <Layout.Panel side="right" open={true} size="x-small">
                    {this.props.children}
                </Layout.Panel>
            );
        } else {
            return (
                <div className="sd-overlay-panel sd-overlay-panel--open sd-overlay-panel--dark-ui">
                    <div className="side-panel side-panel--shadow-right side-panel--dark-ui">
                        {this.props.children}
                    </div>
                </div>
            );
        }
    }
}
