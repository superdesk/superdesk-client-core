import React from 'react';
import {IPropsSendToPanel} from './panel-main';

export class PanelContent extends React.PureComponent<IPropsSendToPanel> {
    render() {
        return (
            <div className="side-panel__content" data-test-id={this.props['data-test-id']}>
                <div className="side-panel__content-block" style={{height: '100%'}}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
