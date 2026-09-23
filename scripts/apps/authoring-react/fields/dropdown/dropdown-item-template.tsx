import * as React from 'react';
import {IDropdownConfig, IDropdownOption} from 'superdesk-api';
import {getTextColor} from 'core/helpers/utils';

interface IProps {
    option: IDropdownOption;
    config: IDropdownConfig;

    /**
     * Value should be the same for all options in the visual group
     * Should be true when no items in the visual group have custom background color
     */
    noPadding: boolean;
}

export class DropdownItemTemplate extends React.PureComponent<IProps> {
    render() {
        const {option, noPadding, config} = this.props;

        if (option == null) {
            return null;
        }

        const itemStyle: React.CSSProperties = {
            height: '1.5em',
            minWidth: '1.5em',
            backgroundColor: option.color ?? 'transparent',
            color: option.color == null ? 'black' : getTextColor(option.color),
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: config.source === 'manual-entry' && config.roundCorners ? '999px' : '2px',
            padding: noPadding ? '0' : '4px',
            whiteSpace: 'nowrap',
        };

        // An option with a code shows the code in the badge and the name beside it, as angular's
        // `sd-meta-dropdown` does. Folding both into the badge looks identical while a vocabulary
        // names its items after their codes, and drops the word on one that calls qcode 1 "Urgent".
        if (option.badgeLabel == null) {
            return (
                <span style={itemStyle}>{option.label}</span>
            );
        }

        return (
            <React.Fragment>
                <span style={itemStyle}>{option.badgeLabel}</span>
                <span style={{marginInlineStart: 'var(--gap-0-5)'}}>{option.label}</span>
            </React.Fragment>
        );
    }
}
