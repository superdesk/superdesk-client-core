import React from 'react';

interface IProps {
    availableActions: Array<any>;
    children: any;
}

interface IState {
    actionsDropdownOpen: boolean;
}

export class EditorHighlightsHeader extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            actionsDropdownOpen: false,
        };
    }
    toggleActionsDropdown() {
        this.setState({
            actionsDropdownOpen: !this.state.actionsDropdownOpen,
        });
    }
    render() {
        const {availableActions} = this.props;

        const actionsDropdownStyles: any = this.state.actionsDropdownOpen !== true ? {} : {
            display: 'block',
            position: 'absolute',
            width: 'auto',
            padding: '1rem 0',
            marginBottom: 12, // so the last item doesn't look like it's shaddow is cut off
        };

        return (
            <div className="editor-popup__header">

                <div className="editor-popup__header-text">
                    {this.props.children}
                </div>

                {
                    availableActions.length < 1 ? null : (
                        <div className="editor-popup__header-tools">
                            <div className="dropdown dropdown--align-right">
                                <button
                                    className="icn-btn dropdown__toggle"
                                    onClick={() => this.toggleActionsDropdown()}>
                                    <i className="icon-dots-vertical" />
                                </button>

                                <ul className="dropdown__menu" style={actionsDropdownStyles}>
                                    {
                                        availableActions.map((action, i) => (
                                            <li key={i}>
                                                <button onClick={() => {
                                                    this.toggleActionsDropdown();
                                                    action.onClick();
                                                }}>
                                                    <i className={action.icon} />{action.text}
                                                </button>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }
}
