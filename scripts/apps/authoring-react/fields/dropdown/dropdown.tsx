import * as React from 'react';
import {IDropdownValue, IDropdownConfig} from '.';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {DropdownItemTemplate} from './dropdown-item-template';

interface IProps {
    config: IDropdownConfig;
    value: IDropdownValue;
    onChange(value: IDropdownValue): void;
}

export class Dropdown extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const {options} = config;

        return (
            <SelectFilterable
                items={options}
                value={options.find(({id}) => id === this.props.value) ?? null}
                onChange={(option) => {
                    this.props.onChange(option?.id ?? null);
                }}
                getLabel={(item) => item?.label}
                itemTemplate={(item) => <DropdownItemTemplate option={item.option} config={config} />}
                zIndex={1050}
            />
        );
    }
}
