import * as React from 'react';
import {IDropdownValue, IDropdownConfig} from '.';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {DropdownItemTemplate} from './dropdown-item-template';
import {getOptions} from './get-options';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';

interface IProps {
    config: IDropdownConfig;
    value: IDropdownValue;
    onChange(value: IDropdownValue): void;
}

export class Dropdown extends React.PureComponent<IProps> {
    render() {
        const {config} = this.props;
        const values = this.props.value;
        const options = getOptions(config);

        if (config.multiple) {
            if (!Array.isArray(values)) {
                throw new Error('Value must be an array');
            }

            const selected = options.filter((opt) => (values).includes(opt.id));

            return (
                <MultiSelectTreeWithTemplate
                    kind="synchronous"
                    getOptions={() => ({
                        nodes: options.map((option) => ({value: option})),
                        lookup: {},
                    })}
                    values={selected}
                    onChange={(_values) => {
                        this.props.onChange(_values.map((val) => val.id));
                    }}
                    optionTemplate={({item}) => <span style={{border: '1px dotted blue'}}>{item.label}</span>}
                    valueTemplate={({item}) => <span style={{border: '1px dotted green'}}>{item.label}</span>}
                    getId={(option) => option.id.toString()}
                    getLabel={(option) => option.label}
                />
            );
        } else {
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
                    disabled={config.readOnly === true}
                />
            );
        }
    }
}
