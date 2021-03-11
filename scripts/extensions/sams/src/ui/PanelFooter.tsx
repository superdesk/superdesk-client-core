import * as React from 'react';

interface IProps {
    children?: React.ReactNode;
}

export class PanelFooter extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="side-panel__footer side-panel__footer--button-box">
                <div className="flex-grid flex-grid--boxed-small flex-grid--wrap-items flex-grid--small-2">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
