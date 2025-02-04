import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IPropsSendToPanel} from './panel-main';

export class PanelHeader extends React.PureComponent<IPropsSendToPanel> {
    render() {
        if (this.props.markupV2) {
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
