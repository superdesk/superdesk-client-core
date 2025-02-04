import React from 'react';

interface IProps {
    header: string;
    onClose(): void;
}

export class PreviewComponent extends React.Component<IProps, {}> {
    render() {
        return (
            <div className="sd-main-content-grid__preview open-preview">
                <div className="side-panel__container">
                    <div className="side-panel side-panel--bg-00 side-panel--shadow-right">
                        <div className="side-panel__header">
                            <div className="sd-nav-tabs">
                                <button className="sd-nav-tabs__tab sd-nav-tabs__tab--active">
                                    <span>{this.props.header}</span>
                                </button>
                            </div>
                            <div className="side-panel__tools">
                                <a
                                    className="icn-btn"
                                    onClick={() => this.props.onClose()}
                                >
                                    <i className="icon-close-small" />
                                </a>
                            </div>
                        </div>

                        <div className="side-panel__content">
                            <div className="side-panel__content-block">
                                {this.props.children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
