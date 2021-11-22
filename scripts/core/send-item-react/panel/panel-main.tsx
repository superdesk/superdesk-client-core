import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {authoringReactViewEnabled} from 'appConfig';

export class Panel extends React.PureComponent {
    render() {
        if (authoringReactViewEnabled) {
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
