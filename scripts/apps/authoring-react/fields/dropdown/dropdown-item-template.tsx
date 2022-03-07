import * as React from 'react';
import {IDropdownConfig, IDropdownOption} from '.';

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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: config.roundCorners ? '999px' : '0px',
            padding: '4px',
            whiteSpace: 'nowrap',
        };

        return (
            <span style={itemStyle}>{option.label}</span>
        );
    }
}
