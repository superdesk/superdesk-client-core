import React from 'react';
import {IPropsSendToPanel} from './panel-main';

export class PanelFooter extends React.PureComponent<IPropsSendToPanel> {
    render() {
        return (
            <div className="side-panel__footer side-panel__footer--button-box-large">
                <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 8}}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
