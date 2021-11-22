import React from 'react';

export class PanelContent extends React.PureComponent {
    render() {
        return (
            <div className="side-panel__content">
                <div className="side-panel__content-block">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
