import React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import {IPropsSendToPanel} from './panel-main';

export class PanelContent extends React.PureComponent<IPropsSendToPanel> {
    render() {
        if (this.props.markupV2) {
            return (
                <Layout.PanelContent>
                    <Layout.PanelContentBlock>
                        {this.props.children}
                    </Layout.PanelContentBlock>
                </Layout.PanelContent>
            );
        } else {
            return (
                <div className="side-panel__content" data-test-id={this.props['data-test-id']}>
                    <div className="side-panel__content-block" style={{height: '100%'}}>
                        {this.props.children}
                    </div>
                </div>
            );
        }
    }
}
