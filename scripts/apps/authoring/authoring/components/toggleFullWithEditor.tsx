import React from 'react';
import {Icon} from 'superdesk-ui-framework/react/components/Icon';
import {Tooltip} from 'superdesk-ui-framework/react/components/Tooltip';
import classNames from 'classnames';
import {gettext} from 'core/utils';

interface IProps {
    fullWidth: boolean;
    setFullWidth(): void;
}

export class ToggleFullWidth extends React.Component<IProps> {
    render() {
        const classes = classNames('expand-button', {
            'expand-button--expanded': this.props.fullWidth,
        });

        return (
            <Tooltip
                text={this.props.fullWidth ? gettext('Leave full width mode') : gettext('Full width mode')}
                flow="right"
                appendToBody={true}
            >
                <button
                    className={classes}
                    onClick={this.props.setFullWidth}
                >
                    <Icon name="chevron-left-thin" />
                </button>
            </Tooltip>
        );
    }
}
