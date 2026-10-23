import React from 'react';
import classNames from 'classnames';
import {Icon, Tooltip} from 'superdesk-ui-framework/react';

interface IProps {
    icon: string;
    label: string;
    testId: string;
    onClick(): void;

    pressed?: boolean;
}

export const ToolbarIconButton: React.ComponentType<IProps> = ({icon, label, testId, onClick, pressed}) => (
    <Tooltip text={label}>
        <button
            type="button"
            className={classNames('icn-btn', {
                'authoring-toolbar-toggle': pressed != null,
                'authoring-toolbar-toggle--active': pressed === true,
            })}
            aria-label={label}
            aria-pressed={pressed}
            onClick={onClick}
            data-test-id={testId}
        >
            <Icon name={icon} ariaHidden />
        </button>
    </Tooltip>
);
