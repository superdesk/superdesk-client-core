import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {DropdownItemTemplate} from './dropdown-item-template';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const option = value == null ? null : config.options.find((_option) => _option.id === value);

        return (
            <DropdownItemTemplate option={option} config={config} />
        );
    }
}
