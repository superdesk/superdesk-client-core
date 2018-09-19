import React from 'react';
import PropTypes from 'prop-types';
import Submenu from './Submenu';

/**
 * Submenu within item actions.
 */
export default class SubmenuDropdown extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {open: false};
        this.openSubmenu = this.openSubmenu.bind(this);
        this.closeSubmenu = this.closeSubmenu.bind(this);
    }

    openSubmenu() {
        this.setState({open: true});
    }

    closeSubmenu() {
        this.setState({open: false});
    }

    toggleState(event) {
        event.stopPropagation();
        this.setState({open: !this.state.open});
    }

    render() {
        return (
            <div className="dropdown dropdown--noarrow"
                onMouseEnter={this.openSubmenu}
                onMouseLeave={this.closeSubmenu}>
                <a className="dropdown__toggle" title={this.props.label}>
                    {this.props.icon &&
                        <i className={`icon-${this.props.icon}`} />
                    }
                    {this.props.label}
                </a>
                {this.state.open && (
                    <Submenu>{this.props.submenu}</Submenu>
                )}
            </div>
        );
    }
}

SubmenuDropdown.propTypes = {
    icon: PropTypes.string,
    label: PropTypes.string,
    submenu: PropTypes.arrayOf(PropTypes.element),
};
