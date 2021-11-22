import React from 'react';

export class PanelFooter extends React.PureComponent {
    render() {
        return (
            <div className="side-panel__footer side-panel__footer--button-box-large">
                {this.props.children}
            </div>
        );
    }
}
