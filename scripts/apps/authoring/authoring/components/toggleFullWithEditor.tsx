import React from 'react';
import {Icon} from 'superdesk-ui-framework/react/components/Icon';
import {Tooltip} from 'superdesk-ui-framework/react/components/Tooltip';
import classNames from 'classnames';

interface IProps {
    isExpanded: boolean;
    onClick(event): void;
}

export class ToggleFullWidth extends React.Component<IProps> {
    render() {
        const classes = classNames('expand-button', {
            'expand-button--expanded': this.props.isExpanded,
        });

        return (
            <Tooltip
                text={this.props.isExpanded ? 'Revert Authoring' : 'Expand Authoring'}
                flow="right"
                appendToBody={true}
            >
                <button
                    className={classes}
                    onClick={this.props.onClick}
                >
                    <Icon name="chevron-left-thin" />
                </button>
            </Tooltip>
        );
    }
}
