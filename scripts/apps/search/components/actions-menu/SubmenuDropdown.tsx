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
    refEl: HTMLDivElement;

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
        function focusFirstItem() {
            const btn = this.refEl.querySelectorAll('ul')[0]?.querySelectorAll('button:not([disabled])')[0];

            if (btn instanceof HTMLElement) {
                btn.focus();
            }
        }

        this.setState({open: true}, focusFirstItem);
    }

    closeSubmenu() {
        this.setState({open: false});
    }

    toggleState() {
        if (this.state.open) {
            this.closeSubmenu();
        } else {
            this.openSubmenu();
        }
    }

    render() {
        return (
            <div
                className={classNames('dropdown dropdown--noarrow', {'open': this.state.open})}
                onMouseEnter={this.openSubmenu}
                onMouseLeave={this.closeSubmenu}
                ref={(el) => {
                    this.refEl = el;
                }}
            >
                <button
                    className="dropdown__toggle"
                    title={this.props.label}
                    onClick={this.toggleState} // required for keyboard navigation

                    // aria label is needed because playwright treats icon as a character
                    // and can not do an exact match
                    aria-label={this.props.label}
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
