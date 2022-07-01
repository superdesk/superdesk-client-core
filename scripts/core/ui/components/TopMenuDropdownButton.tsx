/* eslint-disable indent */

import React from 'react';
import classNames from 'classnames';

export class TopMenuDropdownButton extends React.PureComponent<{
    onClick: () => void;
    disabled?: boolean;
    active: boolean;
    pulsate: boolean;
    'data-test-id'?: string;
    tooltip?: string;
}> {
    render() {
        const {onClick, active, pulsate} = this.props;

        let classes = classNames('top-menu-dropdown-button', {
            'top-menu-dropdown-button--active': active,
            'top-menu-dropdown-button--pulsate': pulsate,
        });

        return (
            <button
                title={this.props.tooltip}
                onClick={onClick}
                className={classes}
                data-test-id={this.props['data-test-id']}
                disabled={this.props.disabled}
            >
                {this.props.children}
            </button>
        );
    }
}
