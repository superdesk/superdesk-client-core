import React from 'react';
import {IPropsSendToPanel} from './panel-main';

export class PanelHeader extends React.PureComponent<IPropsSendToPanel> {
    render() {
        return (
            <div className="side-panel__header">
                {this.props.children}
            </div>
        );
    }
}
