/* eslint-disable indent */

import React from 'react';
import classNames from 'classnames';

export class TopMenuDropdownButton extends React.PureComponent<{
    onClick: () => void;
    active: boolean;
    pulsate: boolean;
    'data-test-id'?: string;
}> {
    render() {
        const {onClick, active, pulsate} = this.props;

        let classes = classNames('top-menu-dropdown-button', {
            'top-menu-dropdown-button--active': active,
            'top-menu-dropdown-button--pulsate': pulsate,
        });

        return (
            <button
                onClick={onClick}
                className={classes}
                data-test-id={this.props['data-test-id']}
            >
                {this.props.children}
            </button>
        );
    }
}
