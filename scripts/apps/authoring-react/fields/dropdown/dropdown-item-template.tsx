import * as React from 'react';
import {IDropdownConfig, IDropdownOption} from '.';
import {getTextColor} from 'core/helpers/utils';

interface IProps {
    option: IDropdownOption;
    config: IDropdownConfig;
}

export class DropdownItemTemplate extends React.PureComponent<IProps> {
    render() {
        const {option, config} = this.props;

        if (option == null) {
            return null;
        }

        const itemStyle: React.CSSProperties = {
            aspectRatio: '1',
            height: '1.5em',
            backgroundColor: option.color ?? 'transparent',
            color: option.color == null ? 'black' : getTextColor(option.color),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: config.source === 'manual-entry' && config.roundCorners ? '999px' : '2px',
            padding: '4px',
            whiteSpace: 'nowrap',
        };

        return (
            <span style={itemStyle}>{option.label}</span>
        );
    }
}
