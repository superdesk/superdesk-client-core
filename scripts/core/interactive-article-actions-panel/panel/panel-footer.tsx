import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IPropsSendToPanel} from './panel-main';

export class PanelFooter extends React.PureComponent<IPropsSendToPanel> {
    render() {
        if (this.props.markupV2) {
            return (
                <Layout.PanelFooter>
                    {this.props.children}
                </Layout.PanelFooter>
            );
        } else {
            return (
                <div className="side-panel__footer side-panel__footer--button-box-large">
                    {this.props.children}
                </div>
            );
        }
    }
}
