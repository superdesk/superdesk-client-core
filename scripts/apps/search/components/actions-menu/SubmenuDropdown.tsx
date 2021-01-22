import React from 'react';
import classNames from 'classnames';
import Submenu from './Submenu';

interface IProps {
    label: string;
    submenu: Array<JSX.Element>;
    icon: string | null;
}

interface IState {
    open: boolean;
}

/**
 * Submenu within item actions.
 */
export default class SubmenuDropdown extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };

        this.openSubmenu = this.openSubmenu.bind(this);
        this.closeSubmenu = this.closeSubmenu.bind(this);
        this.toggleState = this.toggleState.bind(this);
    }

    openSubmenu() {
        this.setState({open: true});
    }

    closeSubmenu() {
        this.setState({open: false});
    }

    toggleState() {
        this.setState({open: !this.state.open});
    }

    render() {
        return (
            <div className={classNames('dropdown dropdown--noarrow', {'open': this.state.open})}>
                <button
                    className="dropdown__toggle"
                    title={this.props.label}
                    onMouseEnter={this.openSubmenu}
                    onMouseLeave={this.closeSubmenu}
                    onClick={this.toggleState} // required for keyboard navigation
                >
                    {this.props.icon &&
                        <i className={`icon-${this.props.icon}`} />
                    }
                    {this.props.label}
                </button>
                {this.state.open && (
                    <Submenu>{this.props.submenu}</Submenu>
                )}
            </div>
        );
    }
}
