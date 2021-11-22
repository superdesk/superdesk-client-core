import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {authoringReactViewEnabled} from 'appConfig';

export class PanelHeader extends React.PureComponent {
    render() {
        if (authoringReactViewEnabled) {
            return (
                <Layout.PanelHeader>
                    {this.props.children}
                </Layout.PanelHeader>
            );
        } else {
            return (
                <div className="side-panel__header">
                    {this.props.children}
                </div>
            );
        }
    }
}
