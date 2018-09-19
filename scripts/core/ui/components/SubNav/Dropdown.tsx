import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {defer} from 'lodash';
import {firstCharUpperCase} from '../utils';

import {Menu, Label, Divider, Dropdown as DropMenu} from '../Dropdown/';

/**
 * @ngdoc react
 * @name Dropdown
 * @description Dropdown of a Sub Nav bar
 */
export class Dropdown extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    inToggle: any;

    constructor(props) {
        super(props);
        this.state = {open: false};
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        // change state only when click event handling is over
        this.inToggle = true;
        defer(() => {
            this.setState({open: !this.state.open}, () => {
                if (this.state.open) {
                    document.addEventListener('click', this.close);
                } else {
                    document.removeEventListener('click', this.close);
                }
            });
            this.inToggle = false;
        });
    }

    close() {
        if (!this.inToggle && this.state.open) {
            this.setState({open: false});
        }
    }

    componentWillUnmount() {
        if (this.state.open) {
            document.removeEventListener('click', this.close);
        }
    }

    render() {
        const isCreate = this.props.icon === 'icon-plus-large';
        const buttonClassName = classNames(
            'dropdown-toggle',
            'dropdown__toggle',
            this.props.buttonLabelClassName,
            {
                navbtn: this.props.navbtn,
                'sd-create-btn': isCreate,
                'navbtn--text-only': this.props.buttonLabel,
            },
        );

        const buttonDropMenu = (
            <button
                className={buttonClassName}
                onClick={this.props.disableSelection ? this.props.defaultAction : this.toggle}
            >
                {this.props.icon && (
                    <i className={this.props.icon} />
                )}
                {this.props.buttonLabel && this.props.buttonLabel}
                {this.props.buttonLabel && (
                    <span className="dropdown__caret" />
                )}
                {isCreate && (
                    <span className="circle" />
                )}
            </button>
        );

        return (
            <DropMenu
                isOpen={this.state.open}
                alignRight={this.props.alignRight}
                dropUp={this.props.dropUp}
                className={this.props.className}
            >
                {this.props.tooltip ? (
                    <OverlayTrigger placement="left"
                        overlay={
                            <Tooltip id="create_new_btn">
                                {this.props.tooltip}
                            </Tooltip>
                        }
                    >
                        <span>{buttonDropMenu}</span>
                    </OverlayTrigger>
                ) :
                    buttonDropMenu
                }
                <Menu
                    isOpen={this.state.open}
                    alignRight={false}
                    scrollable={this.props.scrollable}
                >
                    {this.props.label && (
                        <Label>{this.props.label}</Label>
                    )}

                    {this.props.label && (
                        <Divider />
                    )}

                    {this.props.items.map((item, index) => {
                        if (item.divider) {
                            return <Divider key={index} />;
                        } else {
                            return (
                                <li key={index}>
                                    <button onClick={() => item.action()}>
                                        {item.icon && (
                                            <i className={classNames(
                                                {'icon--gray': item.disabled},
                                                item.icon,
                                            )} />
                                        )}

                                        <span className={classNames(
                                            {'dropdown__menu-item--disabled': item.disabled},
                                            item.className,
                                        )}>
                                            {firstCharUpperCase(item.label)}
                                        </span>
                                    </button>
                                </li>
                            );
                        }
                    })}
                </Menu>
            </DropMenu>
        );
    }
}

Dropdown.propTypes = {
    icon: PropTypes.string,
    buttonLabel: PropTypes.string,
    buttonLabelClassName: PropTypes.string,
    label: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        divider: PropTypes.bool,
        icon: PropTypes.string,
        action: PropTypes.func,
        className: PropTypes.string,
        disabled: PropTypes.bool,
    })),
    alignRight: PropTypes.bool,
    disableSelection: PropTypes.bool,
    defaultAction: PropTypes.func,
    dropUp: PropTypes.bool,
    navbtn: PropTypes.bool,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    scrollable: PropTypes.bool,
};

Dropdown.defaultProps = {
    alignRight: false,
    navbtn: true,
    scrollable: false,
};
